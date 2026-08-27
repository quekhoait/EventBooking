from flask import Blueprint

from app.dto.ref_data_dto import CategoryResponseSchema, LocationResponseSchema
from app.services import reference_data_service
from app.utils.json import NewPackage, StatusResponse

data_api = Blueprint('ref_api', __name__, url_prefix='/data')

category_response_schema = CategoryResponseSchema(many=True)
location_response_schema = LocationResponseSchema(many=True)

@data_api.route('/categories', methods=['GET'])
def get_categories():
    categories = reference_data_service.get_all_categories()

    data = category_response_schema.dump(categories)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy danh sách danh mục thành công",
        status_code=200
    )

@data_api.route('/locations', methods=['GET'])
def get_locations():
    """Lấy danh sách địa điểm (dạng cây)."""
    locations = reference_data_service.get_all_locations()
    data = location_response_schema.dump(locations)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy danh sách địa điểm thành công",
        status_code=200
    )


@data_api.route('/locations/tree', methods=['GET'])
def get_location_tree():
    """Lấy cây địa điểm đầy đủ."""
    location_tree = reference_data_service.get_location_tree()
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=location_tree,
        message="Lấy cây địa điểm thành công",
        status_code=200
    )


@data_api.route('/locations/<int:location_id>', methods=['GET'])
def get_location_detail(location_id: int):
    """Lấy chi tiết một địa điểm."""
    from app.repositories import base_repo
    from app.models import LocationModel
    from app.utils.exception import AppException
    from app.errors.error_code import ErrorCode

    location = base_repo.get_by_id(LocationModel, location_id)
    if not location:
        raise AppException(ErrorCode.LOCATION_NOT_FOUND)

    # Serialize thủ công để có full_name
    data = {
        'id': location.id,
        'name': location.name,
        'full_name': location.full_name,
        'parent_id': location.parent_id,
        'children': [
            {
                'id': child.id,
                'name': child.name,
                'full_name': child.full_name
            }
            for child in location.children
        ]
    }

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy thông tin địa điểm thành công",
        status_code=200
    )