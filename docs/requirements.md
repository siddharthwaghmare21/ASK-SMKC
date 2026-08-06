# Municipal AI Knowledge Management System (MAIKMS)
## Requirements Document

**Client:** Sangli, Miraj & Kupwad City (SMKC) Municipal Corporation, Maharashtra, India
**Date:** August 2026

---

## 1. PROJECT OVERVIEW

The **Municipal AI Knowledge Management System (MAIKMS)** is an Enterprise RAG-based (Retrieval-Augmented Generation) Knowledge Management System tailored specifically for the Sangli, Miraj & Kupwad City (SMKC) Municipal Corporation. 

**Purpose:** 
To provide municipal officers, clerks, and citizens with an intelligent, highly accurate, and secure system to query official municipal documents, acts, and resolutions. It is designed to navigate the complexities of municipal governance by grounding all AI responses strictly in official documents.

**Key Characteristics:**
- **Architecture:** Enterprise RAG system. It is **NOT** a general-purpose chatbot and does **NOT** involve training an LLM.
- **AI Engine:** Powered by a local Large Language Model (Ollama + Qwen 2.5).
- **Deployment:** Zero ongoing API cost, fully local deployment ensuring complete data privacy and security.

---

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 Authentication & Authorization
* **Registration & Login:** 
  * User registration requiring email and password.
  * Login mechanism utilizing JWT tokens (access and refresh tokens).
  * Integration with Google OAuth 2.0 for SSO.
* **Role-Based Access Control (RBAC):**
  * Hierarchical access with 6 defined roles: Super Admin, Commissioner, Department Admin, Officer, Clerk, and Citizen.
* **Session Management:** Secure handling of active user sessions.

### 2.2 Document Management
* **Upload Mechanism:** Drag & drop interface for PDF uploads, including metadata assignment.
* **Validation:** Strict file validation allowing only PDFs, with a maximum size of 50MB, including file integrity checks.
* **Versioning:** Built-in document version control.
* **Categorization:** Documents are categorized by Department and Document Type.
  * *Document Types:* Act, GR (Government Resolution), Circular, SOP, Manual, Bylaw, Rule, FAQ.
* **Metadata Requirements:** Name, Department, Type, Version, Language (English/Hindi/Marathi), Effective Date, Keywords, Description.
* **Listing & Display:** Document listing featuring filters, pagination, and sorting capabilities.
* **Deletion:** Soft delete functionality supported by a comprehensive audit trail.

### 2.3 Document Processing Pipeline
* **Text Extraction:** Automatic, high-fidelity text extraction from digital PDFs using PyMuPDF.
* **OCR Capabilities:** Optical Character Recognition for scanned PDFs utilizing Tesseract and EasyOCR (specifically optimized for Devanagari script).
* **Text Normalization:** Cleaning processes including header/footer removal, whitespace normalization, and strict section structure preservation.
* **Chunking Strategy:** Section-aware chunking optimized for legal and municipal documents.
* **Embeddings:** Generation of dense vector embeddings using BAAI/bge-m3.
* **Vector Storage:** Secure and efficient vector storage in Qdrant.
* **Pipeline Management:** Background processing with real-time status tracking and automatic retry mechanisms on failure (maximum 3 retries).

### 2.4 AI Chat (RAG)
* **Core Q&A:** Natural language question-and-answer capabilities grounded **ONLY** in official uploaded documents.
* **Search Strategy:** Hybrid search combining dense vector search, sparse retrieval, and metadata filtering.
* **Memory:** Multi-turn conversation support with a sliding window memory (retaining context of the last 5 exchanges).
* **Streaming:** Real-time streaming responses via Server-Sent Events (SSE).
* **Citations:** Mandatory source citations for every response, detailing Document Name, Section Number, and Page Number.
* **Multilingual Support:** Seamless processing of queries in English, Hindi, and Marathi, with responses delivered in the same language as the query.
* **Session Management:** Ability to create, list, and delete chat sessions, with persistent chat history.
* **Feedback Mechanism:** Per-response user feedback collection (thumbs up/down).

### 2.5 AI Features (Enhanced)
* **AI Explain:** Capability to break down and explain specific sections of complex Acts.
* **AI Summarize:** Generation of concise summaries for Government Resolutions (GRs) and lengthy circulars.
* **AI Compare:** Side-by-side comparison of two GRs or different versions of the same document.
* **AI Checklist:** Automated generation of required document checklists for various municipal processes and citizen services.
* **AI Workflow:** Step-by-step explanations of standard municipal procedures based on SOPs.

### 2.6 Search
* **Hybrid Search Engine:** Combines keyword (BM25), semantic (vector), and metadata search for high precision.
* **Scoping:** Support for both Department-scoped searches and Cross-department global searches.
* **Filters:** Advanced filtering by Department, Document Type, Date Range, and Language.
* **Ranking:** Search result ranking utilizing confidence scores and relevance metrics.

### 2.7 Department Management
* **Supported Departments (16):** Property Tax, Water Supply, Drainage, Solid Waste, Engineering, Fire, Health, Accounts, Legal, Birth & Death, Garden, Education, IT, Administration, Town Planning, Licensing.
* **Scope Definition:** Department-wise document scoping and access control.
* **Specialization:** Department-specific AI querying capabilities.
* **Dashboards:** Dedicated dashboards for Department Admins to monitor metrics and documents.

### 2.8 Analytics & Admin
* **Query Analytics:** Tracking of query volume, department-wise breakdowns, and trending questions.
* **Gap Analysis:** Tracking of unanswered questions to identify missing knowledge base documents.
* **User Stats:** Monitoring of user activity and system engagement.
* **Coverage Metrics:** Analytics on document coverage across different departments and topics.
* **Feedback Analysis:** Aggregation and reporting of user response feedback.
* **Audit Logging:** Comprehensive audit logs covering all critical actions: login, upload, delete, query, and admin actions.
* **Export:** Ability to export audit logs in CSV format.

### 2.9 User Management
* **CRUD:** Full Create, Read, Update, Delete operations on user profiles.
* **Assignment:** Role and Department assignment workflows.
* **Tracking:** Detailed user activity tracking for security and compliance.

---

## 3. NON-FUNCTIONAL REQUIREMENTS

| Category | Requirement |
| :--- | :--- |
| **Performance** | Standard API response < 500ms (excluding AI). AI response generation < 15s (running locally on CPU). |
| **Security** | Enforced HTTPS, JWT-based auth, bcrypt password hashing, rate limiting, CORS configuration, SQL injection protection, strict XSS headers, and robust prompt injection protection. |
| **Scalability** | Architecture must support 100+ concurrent active users and a knowledge base of 1000+ complex documents. |
| **Availability** | 99% uptime target for the core system. |
| **Data Privacy** | **Strictly local storage.** All documents, vectors, and chat histories stored locally on municipal servers. Zero cloud dependency for the core RAG/LLM operations. |
| **Backup & Recovery** | Automated daily backups of both the relational database (MySQL) and vector database (Qdrant). |
| **Multilingual** | Native support for English, Hindi, and Marathi from Day 1 deployment. |
| **Accessibility** | UI/UX designed with a target of WCAG 2.1 AA compliance. |

---

## 4. USER STORIES

### Super Admin
* As a Super Admin, I want to manage all user roles and permissions so that I can control access across the entire corporation.
* As a Super Admin, I want to view system-wide audit logs so that I can investigate security incidents or unauthorized access.
* As a Super Admin, I want to manage the list of available departments so that the system reflects the current organizational structure.
* As a Super Admin, I want to monitor system performance and Qdrant vector database health so that the system remains stable.

### Commissioner
* As the Commissioner, I want to view cross-departmental query analytics so that I can understand what issues are currently trending in the corporation.
* As the Commissioner, I want to use the AI Compare feature on policy documents so that I can quickly understand changes in municipal rules over time.
* As the Commissioner, I want to query the system across all departments simultaneously so that I have a holistic view of municipal operations.

### Department Admin
* As a Department Admin, I want to upload and categorize documents specific to my department so that my officers have the most up-to-date information.
* As a Department Admin, I want to view unanswered questions within my department's scope so that I can identify and upload missing GRs or circulars.
* As a Department Admin, I want to manage officer access within my department so that only authorized personnel can view sensitive internal SOPs.

### Officer
* As an Officer, I want to ask complex legal questions and receive exact section citations from the Municipal Act so that I can draft accurate notices.
* As an Officer, I want to use the AI Summarize feature on 50-page GRs so that I can quickly grasp the key directives without reading the entire document.
* As an Officer, I want my chat history saved so that I can resume researching a specific municipal case the next day.

### Clerk
* As a Clerk, I want to use the AI Checklist feature so that I can tell citizens exactly what documents they need for a new water connection.
* As a Clerk, I want to query the system in Marathi so that I can quickly find answers in my native language while working at the public desk.
* As a Clerk, I want to use the AI Workflow feature so that I can follow the exact standard operating procedure for processing property tax mutations.

### Citizen
* As a Citizen, I want to search for public FAQs and basic rules in Marathi or Hindi so that I can understand municipal services easily.
* As a Citizen, I want to ask how to apply for a birth certificate and get an accurate, polite response based on official rules.
* As a Citizen, I want to register using my Google account so that I don't have to remember another password.

---

## 5. AI BEHAVIOR RULES

The AI engine must strictly adhere to the following behavioral constraints:

1. **Strict Grounding:** The AI must answer **ONLY** using the information present in the official documents stored in the vector database.
2. **Zero Hallucination Policy:** The AI must **NEVER** invent laws, sections, rules, or procedures under any circumstances.
3. **Mandatory Citations:** Every factual claim in a response must **ALWAYS** cite the source document name, section number, and page number.
4. **Fallback Response:** If the requested information is not found in the retrieved context, the AI must explicitly and clearly state: *"Information not found in available official documents."*
5. **Language Matching:** The AI must detect the language of the user's query and respond in the exact same language (English, Hindi, or Marathi).
6. **Deterministic Output:** The LLM temperature must be set to `0.1` to ensure highly deterministic, consistent, and factual responses.
7. **Security:** The system must implement robust prompt injection protection to prevent users from overriding these core directives.

---

## 6. DOCUMENT INVENTORY

The system will initially be seeded and tested with the following 5 critical documents:

| # | Document Name | Pages | Language | Format | Status/Notes |
| :-: | :--- | :-: | :--- | :--- | :--- |
| **1** | `Municipal.pdf` | 341 | English | Digital | Full Maharashtra Municipal Corporations Act (as on May 2025) - **PRIMARY** |
| **2** | `Maharashtra Municipal Corporation Act PDF.pdf` | 275 | English | Digital | PRS version - **BACKUP** |
| **3** | `2 Maharashtra Municipal Corporation 1949.pdf` | 31 | Marathi & English | Digital | Election Rules Schedule D |
| **4** | `Maharashtra-Municipal-Laws-Amendment-Act-2026-JUNE292026.pdf` | 4 | English | Scanned | 2026 Amendment (**Requires OCR**) |
| **5** | `Marathi full Act.pdf` | 538 | Marathi | Scanned | Full Act in Marathi (**Requires complex Devanagari OCR**) |

---

## 7. TECHNOLOGY STACK

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js, React, Tailwind CSS |
| **Backend API** | Python, FastAPI |
| **Relational Database** | MySQL 8.0, SQLAlchemy ORM, Alembic migrations |
| **AI Framework** | LangChain |
| **Local LLM** | Ollama running Qwen 2.5 7B |
| **Embeddings** | BAAI/bge-m3 (Multilingual support) |
| **Vector Database** | Qdrant Community Edition |
| **PDF Processing** | PyMuPDF, pdfplumber |
| **OCR Engine** | Tesseract OCR, EasyOCR (for Devanagari script) |
| **Authentication** | JWT (JSON Web Tokens), Google OAuth 2.0 |
| **Deployment & Hosting** | Docker, Docker Compose, Nginx, Ubuntu Server |
