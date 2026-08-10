from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import AuthProvider

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    role_name: Optional[str] = "user"

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: int
    auth_provider: AuthProvider
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class User(UserInDBBase):
    role: Optional[str] = None
