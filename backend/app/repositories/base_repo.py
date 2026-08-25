from typing import TypeVar, Optional, Type, List
from sqlalchemy import select

from app import db
from app.models import SoftDeleteModel

T = TypeVar('T')


def get_by_id(model: Type[T], entity_id: int, include_deleted: bool = False) -> Optional[T]:
    """Lấy 1 bản ghi theo ID."""
    stmt = select(model).where(model.id == entity_id)

    if include_deleted:
        stmt = stmt.execution_options(include_deleted=True)

    return db.session.scalar(stmt)


def get_all(model: Type[T], include_deleted: bool = False) -> List[T]:
    """Lấy tất cả bản ghi (Mặc định tự động lọc bỏ deleted_at IS NULL)."""
    stmt = select(model)
    if include_deleted:
        stmt = stmt.execution_options(include_deleted=True)

    return list(db.session.scalars(stmt).all())


def save(entity: T) -> T:
    """Thêm mới hoặc Cập nhật 1 bản ghi."""
    db.session.add(entity)
    db.session.commit()
    db.session.refresh(entity)
    return entity


def save_all(entities: List[T]) -> List[T]:
    """Thêm mới hoặc Cập nhật nhiều bản ghi."""
    db.session.add_all(entities)
    db.session.commit()
    return entities


def delete(entity: T, hard_delete: bool = False) -> bool:
    """Xóa 1 entity (Mặc định Xóa mềm nếu model hỗ trợ)."""
    if not hard_delete and isinstance(entity, SoftDeleteModel):
        entity.soft_delete()  # Đánh dấu deleted_at
    else:
        db.session.delete(entity)  # Xóa cứng khỏi DB

    db.session.commit()
    return True


def delete_by_id(model: Type[T], entity_id: int, hard_delete: bool = False) -> bool:
    """Xóa bản ghi theo ID."""
    entity = get_by_id(model, entity_id, include_deleted=hard_delete)
    if entity:
        return delete(entity, hard_delete=hard_delete)
    return False


def restore(entity: T) -> bool:
    """Khôi phục bản ghi đã xóa mềm."""
    if isinstance(entity, SoftDeleteModel):
        entity.restore()  # Set deleted_at = None
        db.session.commit()
        return True
    return False


def restore_by_id(model: Type[T], entity_id: int) -> bool:
    """Khôi phục bản ghi đã xóa mềm theo ID."""
    entity = get_by_id(model, entity_id, include_deleted=True)
    if entity:
        return restore(entity)
    return False