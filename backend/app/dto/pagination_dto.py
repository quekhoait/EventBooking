from dataclasses import dataclass
from typing import List, Generic, TypeVar

T = TypeVar('T')

@dataclass
class LoadMoreResponse(Generic[T]):
    items: List[T]
    page: int
    page_size: int
    has_next: bool