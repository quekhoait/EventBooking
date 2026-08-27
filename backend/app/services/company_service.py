from app.repositories import company_repo
from app.repositories import user_repo  # hoặc repo user của bạn


def get_company_detail(company_id):
    company = company_repo.find_by_id(company_id)
    if not company:
        raise Exception(f"Không tìm thấy công ty với ID {company_id}")
    return company


def get_company_by_user_id(user_id):
    user = user_repo.find_one(id=user_id) if hasattr(user_repo, "find_one") else None
    if not user:
        raise Exception(f"Không tìm thấy tài khoản với ID {user_id}")

    company_id = getattr(user, "company_id", None)
    if not company_id:
        return None
    return company_repo.find_by_id(company_id)


# app/services/company_service.py


def save_company_info(data, user_id=None):
    # Ép kiểu data về dict nếu nó là SimpleNamespace hoặc Object
    if not isinstance(data, dict):
        data = vars(data) if hasattr(data, "__dict__") else dict(data)

    company_id = data.get("id")
    tax_code = data.get("tax_code")

    # 1. Cập nhật nếu đã có ID
    if company_id:
        company = company_repo.find_by_id(company_id)
        if not company:
            raise Exception("Công ty không tồn tại trên hệ thống!")

        if tax_code and tax_code != company.tax_code:
            existing = company_repo.find_by_tax_code(tax_code)
            if existing and existing.id != company.id:
                raise Exception("Mã số thuế này đã được đăng ký bởi đơn vị khác!")

        return company_repo.update_company(company, data)

    # 2. Tạo mới: Kiểm tra trùng mã số thuế
    existing = company_repo.find_by_tax_code(tax_code)
    if existing:
        raise Exception("Mã số thuế này đã được đăng ký trên hệ thống!")

    new_company = company_repo.create_company(
        name=data.get("name"),
        address=data.get("address"),
        description=data.get("description"),
        tax_code=tax_code,
        location_id=data.get("location_id"),
        is_active=True,
    )

    if user_id:
        company_repo.assign_company_to_user(user_id, new_company.id)

    return new_company
