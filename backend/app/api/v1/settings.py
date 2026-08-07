from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.setting import Setting
from app.models.audit import AuditLog

router_settings = APIRouter()
router_audit = APIRouter()

class SettingUpdate(BaseModel):
    setting_key: str
    setting_value: str

class SettingResponse(BaseModel):
    setting_key: str
    setting_value: str
    model_config = {"from_attributes": True}

class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    action: str
    details: str
    created_at: str
    model_config = {"from_attributes": True}

@router_settings.get("/", response_model=List[SettingResponse])
def get_settings(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"])),
) -> Any:
    settings = db.query(Setting).all()
    # map key/value to setting_key/setting_value for response
    return [{"setting_key": s.key, "setting_value": s.value} for s in settings]

@router_settings.post("/", response_model=SettingResponse)
def update_setting(
    setting_in: SettingUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"])),
) -> Any:
    setting = db.query(Setting).filter(Setting.key == setting_in.setting_key).first()
    if not setting:
        setting = Setting(key=setting_in.setting_key, value=setting_in.setting_value)
        db.add(setting)
    else:
        setting.value = setting_in.setting_value
    db.commit()
    db.refresh(setting)
    return {"setting_key": setting.key, "setting_value": setting.value}

@router_audit.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.RoleChecker(["Admin"])),
) -> Any:
    # Join AuditLog with User
    logs = (
        db.query(AuditLog, User)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    response_logs = []
    for log, user in logs:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": user.full_name if user else "System",
            "action": log.action,
            "details": str(log.details) if log.details else "",
            "created_at": str(log.created_at)
        }
        response_logs.append(log_dict)
    return response_logs
