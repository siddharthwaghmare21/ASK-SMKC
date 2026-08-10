from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.department import Department
from app.models.document import Document
from app.schemas.department import DepartmentResponse, DepartmentStats, DepartmentCreate
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter()

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Retrieve departments.
    """
    departments = db.query(Department).offset(skip).limit(limit).all()
    return departments

@router.post("/", response_model=DepartmentResponse, status_code=201)
def create_department(
    *,
    db: Session = Depends(deps.get_db),
    department_in: DepartmentCreate,
    current_user: User = Depends(deps.RoleChecker(["admin"])),
) -> Any:
    """
    Create new department.
    """
    department = Department(
        name=department_in.name,
        description=department_in.description,
    )
    db.add(department)
    db.commit()
    db.refresh(department)
    
    # Audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="CREATE_DEPARTMENT",
        entity_type="Department",
        entity_id=str(department.id),
        details={"name": department.name}
    )
    db.add(audit_log)
    db.commit()
    
    return department

@router.delete("/{department_id}", response_model=DepartmentResponse)
def delete_department(
    *,
    db: Session = Depends(deps.get_db),
    department_id: int,
    current_user: User = Depends(deps.RoleChecker(["admin"])),
) -> Any:
    """
    Delete a department.
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Optional: We could check if there are documents associated with this department before deleting.
    # For now we will allow it, but might result in foreign key violation if cascade delete is not set.
    db.delete(department)
    db.commit()
    
    # Audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="DELETE_DEPARTMENT",
        entity_type="Department",
        entity_id=str(department.id),
        details={"name": department.name}
    )
    db.add(audit_log)
    db.commit()
    
    return department

@router.get("/{department_id}/stats", response_model=DepartmentStats)
def get_department_stats(
    department_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["admin"])),
) -> Any:
    """
    Get statistics for a specific department.
    """
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    document_count = db.query(func.count(Document.id)).filter(Document.department_id == department_id).scalar()
    
    # We could also count queries from the audit log or chat sessions if we want
    # For now, return document count
    return DepartmentStats(
        department_id=department.id,
        name=department.name,
        total_documents=document_count or 0,
        total_queries=0  # Placeholder for future analytics integration
    )
