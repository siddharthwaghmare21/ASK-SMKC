from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.document import Document
from app.models.department import Department
from app.models.audit import AuditLog
from app.models.chat import ChatSession, ChatMessage

router = APIRouter()

class DashboardStats(BaseModel):
    total_users: int
    total_documents: int
    total_departments: int
    total_queries: int

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"])),
) -> Any:
    """Get high-level stats for the admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar()
    total_documents = db.query(func.count(Document.id)).scalar()
    total_departments = db.query(func.count(Department.id)).scalar()
    # Count only user messages as queries
    total_queries = db.query(func.count(ChatMessage.id)).filter(ChatMessage.role == "user").scalar()
    
    return DashboardStats(
        total_users=total_users or 0,
        total_documents=total_documents or 0,
        total_departments=total_departments or 0,
        total_queries=total_queries or 0
    )
