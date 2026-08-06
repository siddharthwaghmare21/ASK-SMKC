# Municipal AI Knowledge Management System (MAIKMS)
## System Architecture Document

**Client:** SMKC Municipal Corporation

---

## 1. SYSTEM OVERVIEW

The Municipal AI Knowledge Management System (MAIKMS) is an enterprise-grade, RAG-based (Retrieval-Augmented Generation) AI Knowledge Management System designed specifically for the SMKC Municipal Corporation.

**Key Features:**
*   **Enterprise RAG:** Leverages internal documents to provide accurate, context-aware answers.
*   **Local Deployment:** Zero cloud AI dependency. All data, embeddings, and LLM inference run locally to ensure absolute data privacy and security.
*   **Multilingual Support:** Fully supports operations and querying in English, Hindi, and Marathi.

---

## 2. HIGH-LEVEL ARCHITECTURE

The system follows a modern decoupled architecture with a frontend SPA, a backend API layer, an AI/RAG processing engine, and dedicated storage layers for relational and vector data.

```mermaid
graph TD
    User([User / Browser])
    
    subgraph "Reverse Proxy"
        Nginx[Nginx]
    end
    
    subgraph "Frontend Layer"
        NextJS[Next.js App]
    end
    
    subgraph "Backend API Layer"
        FastAPI[FastAPI Backend]
    end
    
    subgraph "AI & RAG Layer"
        LangChain[LangChain Framework]
        Embeddings[Embedding Model]
        Ollama[Ollama LLM Server]
    end
    
    subgraph "Storage Layer"
        MySQL[(MySQL)]
        Qdrant[(Qdrant Vector DB)]
        FileStore[Local File Storage]
    end

    User <-->|HTTPS| Nginx
    Nginx <-->|Routing| NextJS
    Nginx <-->|API Calls| FastAPI
    NextJS <-->|API Calls| FastAPI
    
    FastAPI <-->|SQL Queries| MySQL
    FastAPI <-->|Vector Search| Qdrant
    FastAPI <-->|Read/Write| FileStore
    
    FastAPI <-->|AI Orchestration| LangChain
    LangChain <-->|Generate Embeddings| Embeddings
    LangChain <-->|Generate Text| Ollama
```

---

## 3. COMPONENT DIAGRAM

The architecture is modular, separating concerns across routing, business logic, AI operations, and data access.

### Backend Components

```mermaid
graph TD
    subgraph "FastAPI Application"
        subgraph "API Router Layer"
            AuthRouter[Auth]
            UsersRouter[Users]
            DocsRouter[Documents]
            ChatRouter[Chat]
            SearchRouter[Search]
            AdminRouter[Admin]
        end
        
        subgraph "Middleware Layer"
            AuthMid[Auth & RBAC]
            RateLimiting[Rate Limiting]
            Logging[Logging]
            ErrorHand[Error Handling]
        end

        subgraph "Service Layer"
            AuthSvc[auth_service]
            DocSvc[document_service]
            ProcessSvc[processing_service]
            ChatSvc[chat_service]
            SearchSvc[search_service]
        end

        subgraph "AI Layer"
            RAGEngine[rag_engine]
            EmbedSvc[embedding_service]
            LLMSvc[llm_service]
            RetrieveSvc[retrieval_service]
        end

        subgraph "Data Layer"
            MySQLRepo[MySQL Repositories]
            QdrantClient[Qdrant Client]
            FSClient[File Storage Manager]
        end
    end
    
    API Router Layer --> Middleware Layer
    Middleware Layer --> Service Layer
    Service Layer --> AI Layer
    Service Layer --> Data Layer
    AI Layer --> Data Layer
```

### Frontend Components

```mermaid
graph TD
    subgraph "Next.js Application"
        subgraph "Pages"
            Login[Login]
            Dashboard[Dashboard]
            ChatPage[Chat Interface]
            DocsPage[Documents]
            AdminPage[Admin Panel]
            SearchPage[Global Search]
        end
        
        subgraph "Components"
            Layout[Layout / Navigation]
            ChatComp[Chat Widget]
            UploadComp[Document Upload]
            SearchRes[Search Results]
            AdminPanels[Admin Controls]
        end
        
        subgraph "State & Data"
            StateMgmt[State Management / Redux/Zustand]
            APIClient[Axios API Client]
        end
    end
    
    Pages --> Components
    Components --> StateMgmt
    Components --> APIClient
```

---

## 4. DATA FLOW DIAGRAMS

### 4.1 Document Upload & Processing Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant DB as MySQL
    participant FileSys as File Storage
    participant Processor as Background Worker
    participant Embedder as Embedding Model (bge-m3)
    participant Qdrant as Qdrant
    
    User->>Frontend: Upload PDF Document
    Frontend->>Backend: POST /api/documents/upload
    Backend->>Backend: Validate File format & size
    Backend->>FileSys: Store Raw File
    Backend->>DB: Store Document Metadata (Status: PENDING)
    Backend->>Processor: Trigger Background Processing Task
    Backend-->>Frontend: Return Document ID & Status
    Frontend-->>User: Upload Success
    
    Note over Processor, Qdrant: Asynchronous Processing
    Processor->>DB: Update Status (Status: PROCESSING)
    Processor->>FileSys: Read PDF File
    Processor->>Processor: Extract Text (PyMuPDF / OCR)
    Processor->>Processor: Clean Text & Normalize
    Processor->>Processor: Section-Aware Chunking
    Processor->>Embedder: Generate Embeddings (bge-m3)
    Embedder-->>Processor: Vector Embeddings
    Processor->>Qdrant: Store Chunks & Embeddings + Metadata
    Processor->>DB: Update Document Status (Status: COMPLETED)
```

### 4.2 AI Chat (RAG) Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Embedder as Embedding (bge-m3)
    participant Qdrant as Qdrant
    participant LLM as Ollama (Qwen 2.5)
    participant DB as MySQL
    
    User->>Frontend: Send Question
    Frontend->>Backend: POST /api/chat/message
    Backend->>Backend: Extract Chat History
    Backend->>Embedder: Embed User Query (bge-m3)
    Embedder-->>Backend: Query Vector
    Backend->>Qdrant: Hybrid Search (Vector + Sparse + Metadata Filter)
    Qdrant-->>Backend: Retrieve Top-K Relevant Chunks
    Backend->>Backend: Format Context + System Prompt
    Backend->>LLM: Send Prompt to Qwen 2.5 via Ollama
    Note over Backend, LLM: Streaming Response
    LLM-->>Backend: Stream Answer Tokens
    Backend-->>Frontend: Stream Response to Client
    Frontend-->>User: Display Typing Animation
    Backend->>Backend: Extract Citations/References
    Backend->>DB: Store Chat Interaction & Citations
```

### 4.3 Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Middleware as Auth Middleware
    participant DB as MySQL
    
    User->>Frontend: Login (Email/Pass or OAuth)
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: Verify Credentials
    DB-->>Backend: User Details & Roles
    Backend->>Backend: Generate JWT (Access + Refresh)
    Backend-->>Frontend: Return Tokens
    
    Note over User, DB: Subsequent API Requests
    User->>Frontend: Request Protected Resource
    Frontend->>Backend: API Request + JWT Header
    Backend->>Middleware: Intercept Request
    Middleware->>Middleware: Validate JWT Signature & Expiry
    Middleware->>Middleware: Check RBAC Permissions
    alt Authorized
        Middleware->>Backend: Allow Request
        Backend-->>Frontend: Resource Data
    else Unauthorized
        Middleware-->>Frontend: 401/403 Error
    end
```

---

## 5. DEPLOYMENT ARCHITECTURE

The deployment leverages Docker Compose for isolated, reproducible environments across all services.

```mermaid
graph TD
    subgraph "Host Machine (Ubuntu 22.04 LTS)"
        subgraph "Docker Compose Network"
            Nginx[Nginx Container <br/>Ports: 80, 443]
            Frontend[Frontend Container <br/>Next.js - Port: 3000]
            Backend[Backend Container <br/>FastAPI+Uvicorn - Port: 8000]
            MySQL[MySQL Container <br/>Port: 3306]
            Qdrant[Qdrant Container <br/>Ports: 6333, 6334]
            Ollama[Ollama Container <br/>Port: 11434]
            
            subgraph "Docker Volumes"
                mysql_data[(mysql_data)]
                qdrant_data[(qdrant_data)]
                document_storage[(document_storage)]
                ollama_models[(ollama_models)]
            end
        end
    end
    
    Internet((Internet / Intranet)) <-->|HTTP/HTTPS| Nginx
    Nginx <--> Frontend
    Nginx <--> Backend
    
    Backend <--> MySQL
    Backend <--> Qdrant
    Backend <--> Ollama
    Backend <--> document_storage
    
    MySQL <--> mysql_data
    Qdrant <--> qdrant_data
    Ollama <--> ollama_models
```

---

## 6. TECHNOLOGY STACK

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js | 14+ | React framework for UI |
| | React | 18+ | UI library |
| | Tailwind CSS | 3.4+ | Utility-first styling |
| **Backend** | Python | 3.11+ | Core language |
| | FastAPI | 0.110+ | High-performance web framework |
| | SQLAlchemy | 2.0+ | ORM for MySQL |
| | Alembic | Latest | Database migrations |
| | Uvicorn | Latest | ASGI Web Server |
| **Databases** | MySQL | 8.0+ | Relational data (Users, Metadata, Chat history) |
| | Qdrant | 1.8+ | Vector database for embeddings |
| **AI / ML** | Ollama | 0.3+ | Local LLM hosting |
| | Qwen 2.5 7B | 7B | Base LLM model |
| | BAAI/bge-m3 | Latest | Multilingual embeddings (1024 dims) |
| | LangChain | 0.2+ | LLM orchestration framework |
| **Document Processing**| PyMuPDF | 1.24+ | Fast PDF text extraction |
| | pdfplumber | Latest | Complex layout PDF extraction |
| | Tesseract / EasyOCR | 5.0+ / Latest | OCR for scanned documents |
| **Security** | python-jose | Latest | JWT creation and verification |
| | passlib (bcrypt) | Latest | Password hashing |
| **Infrastructure** | Docker & Compose | Latest | Containerization |
| | Nginx | Latest | Reverse proxy & static file server |
| | Ubuntu | 22.04 LTS | Production operating system |

---

## 7. SECURITY ARCHITECTURE

Security is a primary focus for MAIKMS, especially given the handling of municipal data.

*   **Authentication & Authorization:**
    *   JWT-based authentication (Access & Refresh tokens).
    *   Robust Role-Based Access Control (RBAC) middleware enforcing permissions (e.g., Admin vs. Standard User vs. Read-Only).
*   **Transport Security:**
    *   HTTPS/TLS encryption for all client-server communication.
*   **API Security:**
    *   Rate limiting implemented on critical endpoints to prevent abuse.
    *   Strict CORS (Cross-Origin Resource Sharing) policy.
    *   Input validation and sanitization using Pydantic schemas.
*   **Data Security:**
    *   SQL injection protection enforced via SQLAlchemy parameterized queries and ORM models.
    *   XSS (Cross-Site Scripting) protection headers enforced at the Nginx and FastAPI layers.
    *   Strict file upload validation (MIME type, size, extension) to prevent malicious payloads.
*   **AI Security:**
    *   Prompt injection detection to prevent malicious manipulation of the LLM.
*   **Auditing:**
    *   Comprehensive audit logging for document access, modifications, and system configurations.

---

## 8. SCALABILITY CONSIDERATIONS

While deployed locally, the architecture is designed to scale as usage grows.

*   **Horizontal Scaling:** The FastAPI backend is stateless, allowing multiple worker processes to run concurrently via Gunicorn/Uvicorn to handle higher API load.
*   **Vertical Scaling (AI):** The Ollama service will benefit significantly from GPU acceleration (NVIDIA CUDA). Allocating more VRAM directly improves token generation speed and concurrency.
*   **Caching Strategy:**
    *   **Response Caching:** Optional Redis integration to cache frequent API responses.
    *   **Embedding Cache:** Implementing an embedding cache to avoid re-embedding identical user queries.
*   **Database Optimization:**
    *   SQLAlchemy connection pooling to manage concurrent MySQL connections efficiently.
    *   Appropriate indexing on MySQL tables and Qdrant collections.
