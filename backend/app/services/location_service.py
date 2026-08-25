from app.models import LocationModel
from app.repositories import base_repo


def _get_location_name(location_id: int | None) -> str | None:
    """Tra cứu Location và trả về name nếu tồn tại."""
    if not location_id:
        return None
    location = base_repo.get_by_id(LocationModel, location_id)
    if not location:
        return None
    return location.full_name()