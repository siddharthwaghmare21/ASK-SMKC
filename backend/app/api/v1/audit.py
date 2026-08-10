from typing import List, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from datetime import datetime

from app.api import deps
from app.models.user import User
from app.models.audit import AuditLog

router = APIRouter()

class AuditLogResponse(BaseModel):
    id: int
    created_at: datetime
    user_name: str
    action: str
    details: Optional[str] = None
    
    class Config:
        orm_mode = True

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["admin"])),
) -> Any:
    """Get all audit logs, joined with user for username."""
    logs = (
        db.query(AuditLog, User.full_name)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(desc(AuditLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Format for response
    result = []
    for log, full_name in logs:
        details_str = None
        if log.details:
            details_str = str(log.details)
            
        result.append(AuditLogResponse(
            id=log.id,
            created_at=log.created_at,
            user_name=full_name or "System",
            action=log.action,
            details=details_str
        ))
        
    return result
