# MAIKMS Folder Structure

This document outlines the directory structure and key files for the Municipal AI Knowledge Management System (MAIKMS) project.

```text
maikms/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── docs/
│   ├── requirements.md
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-specification.md
│   ├── folder-structure.md
│   └── ai-pipeline-design.md
├── backend/
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── security.py (JWT, password hashing)
│   │   │   ├── config.py (settings management)
│   │   │   ├── exceptions.py (custom exceptions)
│   │   │   └── logging.py (structured logging)
│   │   ├── models/ (SQLAlchemy models)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── role.py
│   │   │   ├── department.py
│   │   │   ├── document.py
│   │   │   ├── chunk.py
│   │   │   ├── chat.py
│   │   │   ├── feedback.py
│   │   │   ├── audit.py
│   │   │   └── settings.py
│   │   ├── schemas/ (Pydantic schemas)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── department.py
│   │   │   ├── document.py
│   │   │   ├── chat.py
│   │   │   ├── search.py
│   │   │   ├── feedback.py
│   │   │   └── admin.py
│   │   ├── routers/ (API endpoints)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── departments.py
│   │   │   ├── documents.py
│   │   │   ├── processing.py
│   │   │   ├── chat.py
│   │   │   ├── search.py
│   │   │   ├── feedback.py
│   │   │   ├── admin.py
│   │   │   └── health.py
│   │   ├── services/ (business logic)
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── document_service.py
│   │   │   ├── processing_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── search_service.py
│   │   │   ├── feedback_service.py
│   │   │   └── admin_service.py
│   │   ├── ai/ (AI components)
│   │   │   ├── __init__.py
│   │   │   ├── rag_engine.py
│   │   │   ├── embedding_service.py
│   │   │   ├── llm_service.py
│   │   │   ├── retrieval_service.py
│   │   │   ├── chunking.py
│   │   │   ├── text_cleaner.py
│   │   │   ├── pdf_extractor.py
│   │   │   ├── ocr_service.py
│   │   │   └── prompts.py
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── rbac.py
│   │   │   ├── rate_limiter.py
│   │   │   ├── error_handler.py
│   │   │   └── audit.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── file_utils.py
│   │       ├── validators.py
│   │       └── helpers.py
│   ├── migrations/ (Alembic)
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_documents.py
│   │   ├── test_chat.py
│   │   └── test_processing.py
│   └── storage/
│       └── documents/ (uploaded PDFs organized by dept/year)
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── public/
│   ├── src/
│   │   ├── app/ (Next.js App Router)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── chat/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx
│   │   │       ├── users/page.tsx
│   │   │       ├── departments/page.tsx
│   │   │       └── analytics/page.tsx
│   │   ├── components/
│   │   │   ├── layout/ (Header, Sidebar, Footer)
│   │   │   ├── auth/ (LoginForm, RegisterForm)
│   │   │   ├── chat/ (ChatWindow, MessageBubble, SourceCard)
│   │   │   ├── documents/ (UploadForm, DocumentList, DocumentCard)
│   │   │   ├── search/ (SearchBar, SearchResults)
│   │   │   ├── admin/ (Dashboard, UserTable, AuditLog)
│   │   │   └── ui/ (Button, Input, Modal, Toast, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts (API client)
│   │   │   ├── auth.ts (auth utilities)
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   └── useDocuments.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css
│   └── .env.local.example
├── nginx/
│   ├── nginx.conf
│   └── ssl/ (certificates)
└── scripts/
    ├── setup.sh
    ├── seed_db.py
    └── process_pdfs.py
```

## Directory and File Descriptions

### Root Level
- `README.md`: Project overview and basic setup instructions.
- `docker-compose.dev.yml`: Docker configuration for local development environment.
- `docker-compose.prod.yml`: Docker configuration for production deployment.
- `docs/`: Comprehensive project documentation.

### Backend (`/backend`)
FastAPI application containing the API and AI logic.
- `app/main.py`: Application entry point and router registry.
- `app/core/`: Application-wide configurations, security protocols (JWT/hashing), and exceptions.
- `app/models/`: SQLAlchemy ORM definitions mapping to database tables.
- `app/schemas/`: Pydantic models for API request validation and response serialization.
- `app/routers/`: API route controllers organizing endpoints by resource.
- `app/services/`: Core business logic isolating operations from HTTP and routing constraints.
- `app/ai/`: Artificial intelligence components: RAG engine, LLM integration, embedding generation, text chunking, and PDF text/OCR extraction.
- `app/middleware/`: Request intermediaries (authentication, rate limiting, RBAC, auditing).
- `migrations/`: Alembic database migration scripts for managing schema versions.
- `storage/documents/`: Local/mounted directory for persisting uploaded PDF files securely.

### Frontend (`/frontend`)
Next.js web application.
- `src/app/`: Next.js App Router defining the page hierarchy and routing (auth, dashboard, chat, admin).
- `src/components/`: Reusable React components organized by feature (chat, documents, ui primitives).
- `src/lib/`: External service clients (API calls) and utility functions.
- `src/hooks/`: Custom React hooks for managing state and side-effects.
- `src/context/`: React context providers (e.g., authentication state).
- `src/types/`: TypeScript interface and type definitions.

### Infrastructure & Scripts
- `nginx/`: Reverse proxy configuration and SSL certificates for secure deployment.
- `scripts/`: Utility scripts for project setup, database seeding, and batch document processing tasks.
