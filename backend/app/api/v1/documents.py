import os
import shutil
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import date
import uuid

from app.api import deps
from app.models.user import User
from app.models.document import Document, DocumentType, Language, ProcessingStatus
from app.schemas.document import Document as DocumentSchema, DocumentCreate

router = APIRouter()

UPLOAD_DIR = "storage/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentSchema)
def upload_document(
    document_name: str = Form(...),
    department_id: int = Form(...),
    document_type: DocumentType = Form(...),
    language: Language = Form(...),
    effective_date: date = Form(None),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Upload a new PDF document.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Save file
    file_ext = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)
    
    document = Document(
        document_name=document_name,
        department_id=department_id,
        document_type=document_type,
        language=language,
        effective_date=effective_date,
        description=description,
        uploaded_by=current_user.id,
        file_path=file_path,
        file_size=file_size,
        processing_status=ProcessingStatus.pending
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Trigger background processing task here (Phase 4)
    # e.g., background_tasks.add_task(process_pdf, document.id)
    
    return document

@router.get("", response_model=List[DocumentSchema])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve documents.
    """
    documents = db.query(Document).offset(skip).limit(limit).all()
    return documents

@router.get("/{id}", response_model=DocumentSchema)
def get_document(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get document by ID.
    """
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.get("/{id}/download")
def download_document(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Download a document PDF by ID.
    """
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Physical file not found on server")
        
    return FileResponse(
        path=document.file_path, 
        filename=document.document_name + ".pdf",
        media_type="application/pdf"
    )

@router.delete("/{id}", response_model=DocumentSchema)
def delete_document(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Soft delete a document (or hard delete).
    """
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(document)
    db.commit()
    
    # Ideally delete physical file or keep for audit
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
        
    return document
