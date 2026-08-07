# app/controllers/demo_controller.py
from flask import Blueprint, request

from app.services.demo_service import DemoService
from app.utils.json import NewPackage, StatusResponse

demo_bp = Blueprint('demo', __name__, url_prefix='/api/demo')


@demo_bp.route('/test-exception', methods=['GET'])
def test_exception():
    # 1. Bóc tách dữ liệu từ Request
    error_type = request.args.get('type')

    # 2. Gọi Service xử lý logic (nếu có lỗi, Service sẽ tự raise Exception và Global Handler sẽ bắt)
    data = DemoService.process_test_logic(error_type)

    # 3. Đóng gói và trả về Response cho Client
    return NewPackage(
        status=StatusResponse.SUCCESS,
        message="API hoạt động bình thường!",
        data=data,
        status_code=200
    )