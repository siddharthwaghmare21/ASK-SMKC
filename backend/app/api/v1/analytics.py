from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta

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

class ChartDataPoint(BaseModel):
    date: str
    count: int

@router.get("/chart-data", response_model=List[ChartDataPoint])
def get_chart_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"])),
) -> Any:
    """Get query counts for the last 7 days."""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Query to group by date
    results = (
        db.query(
            func.date(ChatMessage.created_at).label("date"),
            func.count(ChatMessage.id).label("count")
        )
        .filter(ChatMessage.role == "user")
        .filter(ChatMessage.created_at >= seven_days_ago)
        .group_by(func.date(ChatMessage.created_at))
        .order_by(func.date(ChatMessage.created_at))
        .all()
    )
    
    # Create a map for quick lookup
    data_map = {str(r.date): r.count for r in results}
    
    # Fill in the blanks for days with 0 queries
    chart_data = []
    for i in range(7):
        # We go from 6 days ago up to today
        target_date = (datetime.utcnow() - timedelta(days=(6 - i))).date()
        target_str = str(target_date)
        chart_data.append(ChartDataPoint(
            date=target_str,
            count=data_map.get(target_str, 0)
        ))
        
    return chart_data
