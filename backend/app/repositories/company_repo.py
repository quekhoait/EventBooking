from app import db
from app.models import Company
from app.models import User


def find_one(**kwargs):
    return Company.query.filter_by(**kwargs).first()


def find_by_id(company_id):
    return Company.query.filter_by(id=company_id).first()


def find_by_tax_code(tax_code):
    return Company.query.filter_by(tax_code=tax_code).first()


def get_all_active_companies():
    return Company.query.filter_by(is_active=True).all()


def create_company(
    name, address, description, tax_code, location_id=None, is_active=True
):
    company = Company(
        name=name,
        address=address,
        description=description,
        tax_code=tax_code,
        location_id=location_id,
        is_active=is_active,
    )
    db.session.add(company)
    db.session.flush()
    db.session.commit()
    return company


def update_company(company, company_data):
    for key, value in company_data.items():
        if hasattr(company, key) and value is not None:
            setattr(company, key, value)
    db.session.commit()
    return company


def check_user_has_company(user_id):
    user = User.query.filter_by(id=user_id).first()
    if not user:
        return False
    # Kiểm tra theo company_id gắn trên user hoặc logic staff_info
    return getattr(user, "company_id", None) is not None


def assign_company_to_user(user_id, company_id):
    user = User.query.filter_by(id=user_id).first()
    if user and hasattr(user, "company_id"):
        user.company_id = company_id
        db.session.commit()
        return user
    return None
