from functools import wraps

import bcrypt
from flask import flash, redirect, render_template, request, session, url_for
from flask_admin import AdminIndexView, BaseView, expose

from app.models import RoleEnum, User


ADMIN_SESSION_KEY = "admin_user_id"


def get_admin_user():
    user_id = session.get(ADMIN_SESSION_KEY)
    if not user_id:
        return None

    user = User.query.get(user_id)
    if (
        user is None
        or not user.is_active
        or user.role != RoleEnum.ADMIN
    ):
        session.pop(ADMIN_SESSION_KEY, None)
        return None
    return user


def admin_login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if get_admin_user() is None:
            return redirect(url_for("admin_login", next=request.url))
        return view(*args, **kwargs)

    return wrapped


class SecureAdminMixin:
    def is_accessible(self):
        return get_admin_user() is not None

    def inaccessible_callback(self, name, **kwargs):
        if get_admin_user() is None:
            return redirect(url_for("admin_login", next=request.url))
        return redirect(url_for("admin.index"))


class SecureAdminIndexView(SecureAdminMixin, AdminIndexView):
    pass


class SecureAdminView(SecureAdminMixin, BaseView):
    pass


def register_admin_auth(app):
    @app.route("/admin/login", methods=["GET", "POST"])
    def admin_login():
        if get_admin_user() is not None:
            return redirect(request.args.get("next") or url_for("admin.index"))

        if request.method == "POST":
            identity = request.form.get("identity", "").strip()
            password = request.form.get("password", "")
            next_url = request.form.get("next", "")
            user = User.query.filter(
                (User.email == identity) | (User.username == identity)
            ).first()

            password_valid = False
            if user is not None and user.password:
                try:
                    password_valid = bcrypt.checkpw(
                        password.encode("utf-8"),
                        user.password.encode("utf-8"),
                    )
                except ValueError:
                    password_valid = False

            if not password_valid or user.role != RoleEnum.ADMIN or not user.is_active:
                flash("Thông tin đăng nhập không hợp lệ hoặc tài khoản không có quyền admin.", "error")
                return render_template("admin/login.html", next_url=next_url)

            session.clear()
            session[ADMIN_SESSION_KEY] = user.id
            session.permanent = True
            return redirect(next_url or url_for("admin.index"))

        return render_template("admin/login.html", next_url=request.args.get("next", ""))

    @app.route("/admin/logout", methods=["POST", "GET"])
    def admin_logout():
        session.pop(ADMIN_SESSION_KEY, None)
        flash("Bạn đã đăng xuất khỏi trang quản trị.", "success")
        return redirect(url_for("admin_login"))
