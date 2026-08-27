from flask import Blueprint, request

from app.dto.ref_data_dto import CategoryResponseSchema, LocationResponseSchema
from app.services import reference_data_service, company_service
from app.utils.json import NewPackage, StatusResponse
from app.dto.user_dto import CompanyRequestDto, CompanyResponseDto

data_api = Blueprint("ref_api", __name__, url_prefix="/data")

category_response_schema = CategoryResponseSchema(many=True)
location_response_schema = LocationResponseSchema(many=True)


@data_api.route("/categories", methods=["GET"])
def get_categories():
    categories = reference_data_service.get_all_categories()

    data = category_response_schema.dump(categories)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy danh sách danh mục thành công",
        status_code=200,
    )


@data_api.route("/locations", methods=["GET"])
def get_locations():
    """Lấy danh sách địa điểm (dạng cây)."""
    locations = reference_data_service.get_all_locations()
    data = location_response_schema.dump(locations)
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy danh sách địa điểm thành công",
        status_code=200,
    )


@data_api.route("/locations/tree", methods=["GET"])
def get_location_tree():
    """Lấy cây địa điểm đầy đủ."""
    location_tree = reference_data_service.get_location_tree()
    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=location_tree,
        message="Lấy cây địa điểm thành công",
        status_code=200,
    )


@data_api.route("/locations/<int:location_id>", methods=["GET"])
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
        "id": location.id,
        "name": location.name,
        "full_name": location.full_name,
        "parent_id": location.parent_id,
        "children": [
            {"id": child.id, "name": child.name, "full_name": child.full_name}
            for child in location.children
        ],
    }

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy thông tin địa điểm thành công",
        status_code=200,
    )


@data_api.route("/preferences", methods=["GET"])
def get_preferences():
    """
    Lấy danh sách các thể loại yêu thích của user.
    Query params: ?user_id=1
    """
    user_id = request.args.get("user_id", type=int)

    data = reference_data_service.get_user_preferences(user_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=data,
        message="Lấy danh sách sở thích thành công",
        status_code=200,
    )


@data_api.route("/preferences", methods=["POST", "PUT"])
def update_preferences():
    """
    Cập nhật toàn bộ danh sách thể loại yêu thích (Ghi đè).
    Body JSON:
    {
        "user_id": 1,
        "category_ids": [1, 2, 5]
    }
    """
    req_data = request.get_json() or {}
    user_id = req_data.get("user_id")
    # Hỗ trợ cả 2 key 'category_ids' hoặc 'categories' gửi từ frontend
    category_ids = req_data.get("category_ids") or req_data.get("categories") or []

    result = reference_data_service.update_user_preferences(user_id, category_ids)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=result,
        message="Cập nhật danh sách sở thích thành công",
        status_code=200,
    )


@data_api.route("/preferences/add", methods=["POST"])
def add_preferences():
    """
    Thêm bổ sung các thể loại vào danh sách hiện tại (Không ghi đè).
    Body JSON:
    {
        "user_id": 1,
        "category_ids": [3, 4]
    }
    """
    req_data = request.get_json() or {}
    user_id = req_data.get("user_id")
    category_ids = req_data.get("category_ids") or req_data.get("categories") or []

    result = reference_data_service.add_user_preferences(user_id, category_ids)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=result,
        message="Thêm sở thích thành công",
        status_code=200,
    )


@data_api.route("/preferences/<int:category_id>", methods=["DELETE"])
def delete_single_preference(category_id: int):
    """
    Xóa 1 thể loại cụ thể khỏi sở thích.
    Query params: ?user_id=1
    """
    user_id = request.args.get("user_id", type=int)

    reference_data_service.delete_user_preference(user_id, category_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=None,
        message="Xóa sở thích thành công",
        status_code=200,
    )


@data_api.route("/preferences", methods=["DELETE"])
def clear_all_preferences():
    """
    Xóa toàn bộ sở thích của user.
    Body JSON hoặc Query: {"user_id": 1} hoặc ?user_id=1
    """
    req_data = request.get_json(silent=True) or {}
    user_id = req_data.get("user_id") or request.args.get("user_id", type=int)

    reference_data_service.clear_user_preferences(user_id)

    return NewPackage(
        status=StatusResponse.SUCCESS,
        data=None,
        message="Đã xóa toàn bộ danh sách sở thích",
        status_code=200,
    )


@data_api.route("/company/<int:company_id>", methods=["GET"])
def get_company(company_id):
    try:
        company = company_service.get_company_detail(company_id)
        result = CompanyResponseDto().dump(company)
        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Lấy thông tin công ty thành công",
            data=result,
            status_code=200,
        )
    except Exception as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=str(e),
            status_code=404,
        )


@data_api.route("/company/user/<int:user_id>", methods=["GET"])
def get_company_by_user(user_id):
    try:
        company = company_service.get_company_by_user_id(user_id)
        result = CompanyResponseDto().dump(company) if company else None
        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Lấy thông tin công ty theo người dùng thành công",
            data=result,
            status_code=200,
        )
    except Exception as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=str(e),
            status_code=400,
        )


@data_api.route("/company", methods=["POST"])
def save_company():
    try:
        req_data = request.get_json(silent=True) or {}
        validated_data = CompanyRequestDto().load(req_data)

        # Lấy user_id gửi lên từ form hoặc token
        user_id = req_data.get("user_id") or req_data.get("id")

        company = company_service.save_company_info(validated_data, user_id=user_id)
        result = CompanyResponseDto().dump(company)

        return NewPackage(
            status=StatusResponse.SUCCESS,
            message="Lưu hồ sơ doanh nghiệp thành công",
            data=result,
            status_code=200,
        )
    except Exception as e:
        return NewPackage(
            status=StatusResponse.ERROR,
            message=str(e),
            status_code=400,
        )
