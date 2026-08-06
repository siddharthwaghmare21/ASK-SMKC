from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.document import DocumentType, Language, ProcessingStatus

class DocumentBase(BaseModel):
    document_name: str
    department_id: int
    document_type: DocumentType
    language: Language
    effective_date: Optional[date] = None
    version: Optional[str] = "1.0"
    keywords: Optional[List[str]] = None
    description: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    document_name: Optional[str] = None
    department_id: Optional[int] = None
    document_type: Optional[DocumentType] = None
    language: Optional[Language] = None
    effective_date: Optional[date] = None
    version: Optional[str] = None
    keywords: Optional[List[str]] = None
    description: Optional[str] = None

class DocumentInDBBase(DocumentBase):
    id: int
    uploaded_by: int
    file_path: str
    file_size: int
    page_count: Optional[int] = None
    processing_status: ProcessingStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class Document(DocumentInDBBase):
    pass
