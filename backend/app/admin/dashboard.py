from calendar import monthrange
from datetime import date, datetime, timedelta
from pathlib import Path

from flask import request
from flask_admin import AdminIndexView, expose
from jinja2 import ChoiceLoader, FileSystemLoader

from app import db
from app.models import Company, EventModel, PaymentModel, PaymentStatus, PaymentType


TEMPLATE_DIRECTORY = Path(__file__).with_name("templates")
VALID_PERIODS = {"day", "month", "year", "custom"}
VALID_GROUPS = {"day", "month", "year"}


class AdminDashboardView(AdminIndexView):
    """Single system-wide overview for the Flask-Admin area."""

    @expose("/")
    def index(self):
        period = request.args.get("period", "month")
        group_by = request.args.get("group_by", "")
        date_from = request.args.get("date_from", "")
        date_to = request.args.get("date_to", "")
        start_date, end_date, group_by = resolve_range(
            period=period,
            group_by=group_by,
            date_from=date_from,
            date_to=date_to,
        )
        return self.render(
            "admin/dashboard.html",
            **build_dashboard_data(start_date, end_date, group_by),
            selected_period=period if period in VALID_PERIODS else "month",
            selected_group=group_by,
            date_from=date_from,
            date_to=date_to,
        )


def register_admin_dashboard(admin) -> AdminDashboardView:
    """Register only the system overview in Flask-Admin."""
    existing_loader = admin.app.jinja_loader
    loaders = [FileSystemLoader(str(TEMPLATE_DIRECTORY))]
    if existing_loader is not None:
        loaders.append(existing_loader)
    admin.app.jinja_loader = ChoiceLoader(loaders)

    return admin.index_view


def resolve_range(
    *, period: str, group_by: str, date_from: str, date_to: str
) -> tuple[date, date, str]:
    """Resolve the requested period into inclusive dates and chart grouping."""
    today = date.today()
    period = period if period in VALID_PERIODS else "month"

    if period == "day":
        start_date = end_date = today
        default_group = "day"
    elif period == "year":
        start_date = date(today.year, 1, 1)
        end_date = today
        default_group = "month"
    elif period == "custom":
        start_date = parse_date(date_from) or today.replace(day=1)
        end_date = parse_date(date_to) or today
        if end_date < start_date:
            start_date, end_date = end_date, start_date
        default_group = "day" if (end_date - start_date).days <= 31 else "month"
    else:
        start_date = today.replace(day=1)
        end_date = today
        default_group = "day"

    selected_group = group_by if group_by in VALID_GROUPS else default_group
    return start_date, end_date, selected_group


def parse_date(value: str) -> date | None:
    try:
        return date.fromisoformat(value) if value else None
    except ValueError:
        return None


def build_dashboard_data(start_date: date, end_date: date, group_by: str) -> dict:
    """Read and aggregate dashboard metrics from the database."""
    start_at = datetime.combine(start_date, datetime.min.time())
    end_at = datetime.combine(end_date + timedelta(days=1), datetime.min.time())
    buckets = build_buckets(start_date, end_date, group_by)

    payments = PaymentModel.query.filter(
        PaymentModel.created_at >= start_at,
        PaymentModel.created_at < end_at,
        PaymentModel.status == PaymentStatus.SUCCESS,
        PaymentModel.type == PaymentType.PAYMENT,
    ).all()
    events = EventModel.query.filter(
        EventModel.created_at >= start_at,
        EventModel.created_at < end_at,
    ).all()
    organizers = Company.query.filter(
        Company.created_at >= start_at,
        Company.created_at < end_at,
    ).all()

    revenue_values = aggregate_values(payments, buckets, group_by, "amount")
    event_values = aggregate_values(events, buckets, group_by)
    organizer_values = aggregate_values(organizers, buckets, group_by)
    revenue = sum(float(payment.amount or 0) for payment in payments)

    return {
        "revenue": revenue,
        "event_count": len(events),
        "organizer_count": len(organizers),
        "published_count": sum(
            getattr(event.status, "value", event.status) == "PUBLISHED" for event in events
        ),
        "labels": [bucket["label"] for bucket in buckets],
        "revenue_values": revenue_values,
        "event_values": event_values,
        "organizer_values": organizer_values,
        "range_label": f"{start_date:%d/%m/%Y} - {end_date:%d/%m/%Y}",
    }


def build_buckets(start_date: date, end_date: date, group_by: str) -> list[dict]:
    buckets = []
    cursor = start_date
    while cursor <= end_date:
        if group_by == "year":
            bucket_end = date(cursor.year, 12, 31)
            key = str(cursor.year)
            label = str(cursor.year)
            next_cursor = date(cursor.year + 1, 1, 1)
        elif group_by == "month":
            bucket_end = date(cursor.year, cursor.month, monthrange(cursor.year, cursor.month)[1])
            key = f"{cursor.year:04d}-{cursor.month:02d}"
            label = f"{cursor.month:02d}/{cursor.year}"
            next_cursor = bucket_end + timedelta(days=1)
        else:
            bucket_end = cursor
            key = cursor.isoformat()
            label = cursor.strftime("%d/%m")
            next_cursor = cursor + timedelta(days=1)
        buckets.append({"key": key, "label": label, "start": cursor, "end": min(bucket_end, end_date)})
        cursor = next_cursor
    return buckets


def aggregate_values(items, buckets: list[dict], group_by: str, field: str | None = None) -> list[float | int]:
    values = {bucket["key"]: 0 for bucket in buckets}
    for item in items:
        created_at = getattr(item, "created_at", None)
        if not created_at:
            continue
        key = bucket_key(created_at.date(), group_by)
        if key in values:
            values[key] += float(getattr(item, field) or 0) if field else 1
    return [round(values[bucket["key"]], 2) for bucket in buckets]


def bucket_key(value: date, group_by: str) -> str:
    if group_by == "year":
        return str(value.year)
    if group_by == "month":
        return f"{value.year:04d}-{value.month:02d}"
    return value.isoformat()
