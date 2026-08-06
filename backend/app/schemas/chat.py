from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatMessageBase(BaseModel):
    role: str
    content: str
    citations: Optional[str] = None

class ChatMessageCreate(BaseModel):
    content: str
    department_id: Optional[int] = None  # To limit search scope to a specific department

class ChatMessageResponse(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Session"

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
