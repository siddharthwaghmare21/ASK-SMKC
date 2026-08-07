from typing import Optional
from pydantic import BaseModel

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

class DepartmentStats(BaseModel):
    department_id: int
    name: str
    total_documents: int
    total_queries: Optional[int] = 0
