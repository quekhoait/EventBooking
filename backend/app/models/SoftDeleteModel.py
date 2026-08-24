from sqlalchemy import func, event
from sqlalchemy.orm import with_loader_criteria

from app import db
from .BaseModel import BaseModel

class SoftDeleteModel(BaseModel):
    __abstract__ = True

    deleted_at = db.Column(db.DateTime, nullable=True, default=None)

    def soft_delete(self):
        """Đánh dấu xóa mềm"""
        self.deleted_at = func.now()
        db.session.add(self)

    def restore(self):
        """Khôi phục dữ liệu đã xóa mềm"""
        self.deleted_at = None
        db.session.add(self)


@event.listens_for(db.session, "do_orm_execute")
def _add_soft_delete_filter(execute_state):
    """
    Tự động chèn điều kiện `deleted_at IS NULL` cho tất cả các câu SELECT
    liên quan đến SoftDeleteModel ở cấp độ ORM.
    """
    if (
        execute_state.is_select
        and not execute_state.execution_options.get("include_deleted", False)
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                SoftDeleteModel,
                lambda cls: cls.deleted_at.is_(None),
                include_aliases=True
            )
        )