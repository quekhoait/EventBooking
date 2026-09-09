from typing import Optional

from flask import flash, redirect, request, url_for
from flask_admin import BaseView, expose

from app import db
from app.models import EventModel, EventStatus, Report, User


class EventAdminView(BaseView):
    """Admin management for event posts and event reports."""

    @expose("/")
    def index(self):
        query = request.args.get("q", "").strip()
        status = request.args.get("status", "all")
        events_query = EventModel.query.order_by(EventModel.created_at.desc())
        if query:
            events_query = events_query.filter(EventModel.name.ilike(f"%{query}%"))
        if status in {item.name for item in EventStatus}:
            events_query = events_query.filter(EventModel.status == EventStatus[status])
        events = events_query.all()
        return self.render(
            "admin/events/list.html",
            events=[self._event_record(event) for event in events],
            query=query,
            selected_status=status,
            statuses=EventStatus,
            counts=self._counts(),
        )

    @expose("/<int:event_id>/")
    def details(self, event_id):
        record = self._event_record(db.session.get(EventModel, event_id))
        if record is None:
            flash("Không tìm thấy bài đăng sự kiện.", "error")
            return redirect(url_for("event-admin.index"))
        return self.render("admin/events/detail.html", **record, statuses=EventStatus)

    @expose("/<int:event_id>/status/", methods=("POST",))
    def update_status(self, event_id):
        event = db.session.get(EventModel, event_id)
        status_name = request.form.get("status", "")
        if event is None:
            flash("Không tìm thấy bài đăng sự kiện.", "error")
            return redirect(url_for("event-admin.index"))
        if status_name not in {item.name for item in EventStatus}:
            flash("Trạng thái sự kiện không hợp lệ.", "error")
            return redirect(url_for("event-admin.details", event_id=event_id))
        event.status = EventStatus[status_name]
        db.session.commit()
        flash("Đã cập nhật trạng thái bài đăng sự kiện.", "success")
        return redirect(url_for("event-admin.details", event_id=event_id))

    @expose("/reports/")
    def reports(self):
        query = request.args.get("q", "").strip()
        reports_query = Report.query.order_by(Report.created_at.desc())
        if query:
            reports_query = reports_query.filter(
                Report.name.ilike(f"%{query}%")
                | Report.content.ilike(f"%{query}%")
            )
        reports = reports_query.all()
        return self.render(
            "admin/events/reports.html",
            reports=[self._report_record(report) for report in reports],
            query=query,
        )

    def _counts(self) -> dict[str, int]:
        return {
            "all": EventModel.query.count(),
            "draft": EventModel.query.filter(EventModel.status == EventStatus.DRAFT).count(),
            "published": EventModel.query.filter(EventModel.status == EventStatus.PUBLISHED).count(),
            "cancelled": EventModel.query.filter(EventModel.status == EventStatus.CANCELLED).count(),
            "reports": Report.query.count(),
        }

    def _event_record(self, event: Optional[EventModel]) -> Optional[dict]:
        if event is None:
            return None
        return {
            "event": event,
            "reports": [self._report_record(report) for report in event.reports],
            "report_count": len(event.reports),
        }

    @staticmethod
    def _report_record(report: Report) -> dict:
        return {
            "report": report,
            "reporter": db.session.get(User, report.user_id),
        }


def register_event_admin(admin) -> EventAdminView:
    """Register event post and report management in Flask-Admin."""
    view = EventAdminView(
        name="Bài đăng sự kiện",
        endpoint="event-admin",
        category="Quản trị hệ thống",
    )
    admin.add_view(view)
    return view
