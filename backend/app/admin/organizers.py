from typing import Optional

from flask import flash, redirect, request, url_for
from flask_admin import BaseView, expose

from app import db
from app.models import Company, Notification, RoleEnum, User


class OrganizerAdminView(BaseView):
    """Admin-only workflow for reviewing organizer applications."""

    @expose("/")
    def index(self):
        query = request.args.get("q", "").strip()
        status = request.args.get("status", "all")
        companies = Company.query.order_by(Company.created_at.desc()).all()
        records = [self._record(company) for company in companies]
        if query:
            normalized = query.lower()
            records = [
                record
                for record in records
                if normalized in " ".join(
                    filter(
                        None,
                        [
                            record["company"].name,
                            record["company"].tax_code,
                            *(user.email for user in record["users"]),
                        ],
                    )
                ).lower()
            ]
        if status in {"approved", "rejected"}:
            records = [record for record in records if record["status"] == status]
        counts = {
            "all": len(companies),
            "approved": sum(self._company_status(company) == "approved" for company in companies),
            "rejected": sum(self._company_status(company) == "rejected" for company in companies),
        }
        return self.render(
            "admin/organizers/list.html",
            records=records,
            counts=counts,
            query=query,
            selected_status=status,
        )

    @expose("/<int:company_id>/")
    def details(self, company_id):
        record = self._get_record(company_id)
        if record is None:
            flash("Không tìm thấy hồ sơ nhà tổ chức.", "error")
            return redirect(url_for("organizer-admin.index"))
        return self.render("admin/organizers/detail.html", **record)

    @expose("/<int:company_id>/review/", methods=("POST",))
    def review(self, company_id):
        record = self._get_record(company_id)
        if record is None:
            flash("Không tìm thấy hồ sơ nhà tổ chức.", "error")
            return redirect(url_for("organizer-admin.index"))

        decision = request.form.get("decision")
        if decision not in {"approve", "reject"}:
            flash("Thao tác xét duyệt không hợp lệ.", "error")
            return redirect(url_for("organizer-admin.details", company_id=company_id))

        approved = decision == "approve"
        company = record["company"]
        company.is_active = approved
        for user in record["users"]:
            if not approved:
                user.is_verified = False
                user.role = RoleEnum.PENDING
            db.session.add(
                Notification(
                    user_id=user.id,
                    title="Kết quả xét duyệt nhà tổ chức",
                    content=(
                        f"Nhà tổ chức {company.name or 'nhà tổ chức'} đã được duyệt. "
                        "Quyền đăng bài của bạn vẫn cần được xét duyệt riêng."
                        if approved
                        else f"Nhà tổ chức {company.name or 'nhà tổ chức'} đã bị từ chối."
                    ),
                )
            )
        db.session.commit()
        flash(
            "Đã duyệt hồ sơ nhà tổ chức."
            if approved
            else "Đã từ chối hồ sơ nhà tổ chức.",
            "success" if approved else "warning",
        )
        return redirect(url_for("organizer-admin.details", company_id=company_id))

    @expose("/<int:company_id>/users/<int:user_id>/review/", methods=("POST",))
    def review_user(self, company_id, user_id):
        record = self._get_record(company_id)
        user = db.session.get(User, user_id)
        if record is None or user is None or user not in record["users"]:
            flash("Không tìm thấy người dùng thuộc nhà tổ chức.", "error")
            return redirect(url_for("organizer-admin.index"))

        decision = request.form.get("decision")
        if decision not in {"approve", "reject"}:
            flash("Thao tác xét duyệt người dùng không hợp lệ.", "error")
            return redirect(url_for("organizer-admin.details", company_id=company_id))
        if not record["company"].is_active:
            flash("Cần duyệt nhà tổ chức trước khi duyệt người dùng.", "warning")
            return redirect(url_for("organizer-admin.details", company_id=company_id))

        approved = decision == "approve"
        user.is_verified = approved
        user.role = RoleEnum.STAFF if approved else RoleEnum.PENDING
        db.session.add(
            Notification(
                user_id=user.id,
                title="Kết quả xét duyệt quyền đăng bài",
                content=(
                    "Bạn đã được phép đăng bài cho nhà tổ chức."
                    if approved
                    else "Quyền đăng bài của bạn chưa được chấp thuận."
                ),
            )
        )
        db.session.commit()
        flash(
            "Đã duyệt người dùng đăng bài."
            if approved
            else "Đã từ chối người dùng đăng bài.",
            "success" if approved else "warning",
        )
        return redirect(url_for("organizer-admin.details", company_id=company_id))

    def _get_record(self, company_id: int) -> Optional[dict]:
        company = db.session.get(Company, company_id)
        if company is None:
            return None
        return self._record(company)

    def _record(self, company: Company) -> dict:
        return {
            "company": company,
            "users": self._users(company),
            "status": self._company_status(company),
        }

    @staticmethod
    def _users(company: Company) -> list[User]:
        return User.query.filter_by(company_id=company.id).order_by(User.id.asc()).all()

    def _company_status(self, company: Company) -> str:
        return "approved" if company.is_active else "rejected"

def register_organizer_admin(admin) -> OrganizerAdminView:
    """Register organizer management in the admin menu."""
    view = OrganizerAdminView(
        name="Nhà tổ chức",
        endpoint="organizer-admin",
        category="Quản trị hệ thống",
    )
    admin.add_view(view)
    return view
