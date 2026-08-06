from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.session import Base

class DocumentType(str, enum.Enum):
    act = "Act"
    gr = "GR"
    circular = "Circular"
    sop = "SOP"
    manual = "Manual"
    bylaw = "Bylaw"
    rule = "Rule"
    faq = "FAQ"

class Language(str, enum.Enum):
    english = "English"
    hindi = "Hindi"
    marathi = "Marathi"

class ProcessingStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    document_name = Column(String(255), index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    language = Column(SQLEnum(Language), nullable=False)
    effective_date = Column(Date, nullable=True)
    version = Column(String(50), default="1.0")
    keywords = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    page_count = Column(Integer, nullable=True)
    processing_status = Column(SQLEnum(ProcessingStatus), default=ProcessingStatus.pending)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = relationship("Department")
    uploader = relationship("User")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    version = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="versions")
    uploader = relationship("User")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    chunk_index = Column(Integer, nullable=False)
    section_number = Column(String(100), nullable=True)
    page_numbers = Column(JSON, nullable=True)
    text_content = Column(Text, nullable=False)
    vector_id = Column(String(100), nullable=True)  # ID in Qdrant

    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")
