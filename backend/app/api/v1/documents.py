import os
import shutil
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import date
import uuid
import logging

from app.api import deps
from app.models.user import User
from app.models.document import Document, DocumentType, Language, ProcessingStatus, DocumentChunk
from app.schemas.document import Document as DocumentSchema, DocumentCreate, DocumentUpdate
from app.services.document_processor import process_document
from app.services.embedding_service import generate_embeddings_and_store

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = "storage/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def process_and_store_document(document_id: int, file_path: str):
    """
    Background task to extract text, chunk it, and generate/store embeddings.
    """
    try:
        # We need a new DB session for background task
        from app.db.session import SessionLocal
        db = SessionLocal()
        
        # 1. Update status to processing
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            db.close()
            return
            
        doc.processing_status = ProcessingStatus.processing
        db.commit()
        
        # 2. Extract and chunk text
        logger.info(f"Processing document {document_id}")
        chunks = process_document(file_path)
        
        # 3. Generate embeddings and store in Qdrant
        metadata = {
            "id": doc.id,
            "document_name": doc.document_name,
            "department_id": doc.department_id,
            "document_type": doc.document_type.value,
            "language": doc.language.value
        }
        
        generate_embeddings_and_store(chunks, metadata)
        
        # 4. Store chunks in DB
        for i, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=doc.id,
                chunk_index=i,
                section_number=chunk.get("section", "Unknown"),
                page_numbers=chunk.get("pages", []),
                text_content=chunk.get("text", "")
            )
            db.add(db_chunk)
        
        # 5. Update status to completed
        doc.processing_status = ProcessingStatus.completed
        db.commit()
        logger.info(f"Successfully processed document {document_id}")
        
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {e}")
        doc.processing_status = ProcessingStatus.failed
        db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=DocumentSchema)
def upload_document(
    background_tasks: BackgroundTasks,
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
    
    # Trigger background processing task here
    background_tasks.add_task(process_and_store_document, document.id, file_path)
    
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

@router.patch("/{id}", response_model=DocumentSchema)
def update_document(
    id: int,
    document_in: DocumentUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update document metadata.
    """
    document = db.query(Document).filter(Document.id == id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    update_data = document_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(document, field, value)
        
    db.commit()
    db.refresh(document)
    return document

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
