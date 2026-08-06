# MAIKMS — Phase 0, 1, 2, 3 Task List

## Phase 0: Planning & Architecture
- [x] Functional requirements
- [x] Non-functional requirements
- [x] User stories per role
- [x] Document types and metadata
- [x] AI behavior rules
- [x] High-level architecture diagram
- [x] Component diagram
- [x] Data flow diagram
- [x] Deployment architecture
- [x] Tech stack with versions
- [x] ER diagram
- [x] MySQL schema — all tables
- [x] Seed data definitions
- [x] Migration strategy
- [x] API Specifications (Auth, User, Doc, Process, Chat, Search, Admin)
- [x] Monorepo layout and structure
- [x] AI Pipeline Design

## Phase 1: Environment Setup
- [x] Create monorepo folder structure
- [x] Initialize git and basic configs
- [x] Setup Python FastAPI project
- [x] Configure database connection
- [x] Setup core dependencies
- [x] Initialize Next.js project
- [x] Setup Tailwind CSS
- [x] Create docker-compose.dev.yml

## Phase 6: System Settings & Auditing
- [x] Settings API (`/api/v1/settings`) for dynamic config (language, prompt rules)
- [x] Audit Log Model & API (`/api/v1/audit`) to track document uploads and administrative actions

## Phase 2: Database & Auth
- [x] Set up SQLAlchemy Core
- [x] Initialize Alembic for migrations
- [x] User and Role models
- [x] Department models
- [x] Document models (Metadata & Chunks)
- [x] Chat & Feedback models
- [x] Audit Log models
- [x] JWT token generation and validation
- [x] Password hashing
- [x] Dependency injection for protected routes
- [x] Role-Based Access Control (RBAC) middleware
- [x] Auth APIs (/login, /register)

## Phase 5: AI Chat System (RAG)
- [x] Chat History Database Models (SQLite)
- [x] Hybrid Retrieval Endpoint (LangChain + Qdrant)
- [x] Ollama Prompt Injection / Chat Controller
- [x] Session & Message APIs (`/api/v1/chat/sessions`, `/api/v1/chat/sessions/{id}/messages`)
- [x] Prompt structure with citations (Marathi + English instruction set)

## Phase 3: PDF Upload System
### 3.1 — Document Model & Storage
- [x] Document Storage Directory Setup
- [x] Pydantic Schemas for Document
### 3.2 — Document APIs
- [x] POST /api/v1/documents/upload (Upload with Metadata)
- [x] GET /api/v1/documents (List paginated)
- [x] GET /api/v1/documents/{id} (Get Details)
- [x] GET /api/v1/documents/{id}/download (Download PDF)
- [x] DELETE /api/v1/documents/{id} (Soft Delete)

## Phase 4: Document Processing Pipeline
- [x] Text extraction (PyMuPDF)
- [x] Text cleaning
- [x] Section-Aware Chunking (Legal Document Focus)
- [x] Embedding Generation (`bge-m3` or fallback)
- [x] Vector Storage (Local Qdrant Database without Docker)
