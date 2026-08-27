# app/services/reference_data_service.py

from app.models import EventCategory, LocationModel
from app.repositories import base_repo


def get_all_categories():
    """Lấy tất cả danh mục."""
    return base_repo.get_all(EventCategory)


def get_all_locations():
    """Lấy tất cả địa điểm (dạng cây)."""
    # Lấy tất cả location gốc (parent_id = None)
    locations = LocationModel.query.filter(LocationModel.parent_id.is_(None)).all()
    return locations


def get_location_tree():
    """Lấy cây địa điểm đầy đủ."""
    # Lấy tất cả location
    all_locations = base_repo.get_all(LocationModel)

    # Tạo dict để map id -> object
    location_map = {loc.id: loc for loc in all_locations}

    # Lấy các location gốc
    roots = [loc for loc in all_locations if loc.parent_id is None]

    # Hàm build tree
    def build_tree(location):
        children = [loc for loc in all_locations if loc.parent_id == location.id]
        return {
            'id': location.id,
            'name': location.name,
            'full_name': location.full_name,
            'parent_id': location.parent_id,
            'children': [build_tree(child) for child in children]
        }

    return [build_tree(root) for root in roots]