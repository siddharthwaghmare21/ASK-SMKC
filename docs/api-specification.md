# MAIKMS API Specification

**Project:** Municipal AI Knowledge Management System (MAIKMS)
**Base URL:** `/api/v1`
**Format:** REST API, JSON request/response

## Standard Headers
- `Authorization`: `Bearer <token>` (Required for all endpoints except where noted)
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit window resets

## Standard Error Format
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Specific field error details"
    }
  }
}
```

## Pagination Format
```json
{
  "page": 1,
  "per_page": 20,
  "total": 100,
  "total_pages": 5,
  "data": [
    // Array of objects
  ]
}
```

---

## 1. AUTH ENDPOINTS (`/api/v1/auth`)

### POST `/register`
- **Description**: Register a new user.
- **Auth required**: No.
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123",
    "full_name": "John Doe",
    "phone": "+1234567890" // Optional
  }
  ```
- **Success response (201 Created)**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
  ```

### POST `/login`
- **Description**: Authenticate user and receive tokens.
- **Auth required**: No.
- **Request body**:
  ```json
  {
    "email": "user@example.com",
    "password": "strongpassword123"
  }
  ```
- **Success response (200 OK)**:
  ```json
  {
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "roles": ["user"]
    }
  }
  ```

### POST `/refresh`
- **Description**: Obtain a new access token using a refresh token.
- **Auth required**: No.
- **Request body**:
  ```json
  {
    "refresh_token": "jwt_refresh_token"
  }
  ```
- **Success response (200 OK)**:
  ```json
  {
    "access_token": "new_jwt_access_token"
  }
  ```

### POST `/logout`
- **Description**: Invalidate the current token.
- **Auth required**: Yes.
- **Request body**: Empty.
- **Success response (200 OK)**:
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

### GET `/me`
- **Description**: Retrieve the current authenticated user's profile.
- **Auth required**: Yes.
- **Success response (200 OK)**:
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "department_id": "dept_uuid",
    "roles": ["user"]
  }
  ```

### GET `/google`
- **Description**: Initiate Google OAuth flow. Redirects to Google login.
- **Auth required**: No.

### GET `/google/callback`
- **Description**: Google OAuth callback endpoint.
- **Auth required**: No.
- **Success response (200 OK)**: Returns tokens similar to `/login`.

---

## 2. USER ENDPOINTS (`/api/v1/users`) [Admin only]

### GET `/`
- **Description**: List all users.
- **Auth required**: Yes (Admin).
- **Query params**: `page` (int), `per_page` (int), `role` (string), `department_id` (string), `status` (string).
- **Success response (200 OK)**: Paginated user list.

### GET `/{id}`
- **Description**: Get details of a specific user.
- **Auth required**: Yes (Admin or self).
- **Success response (200 OK)**: User object.

### PUT `/{id}`
- **Description**: Update user information.
- **Auth required**: Yes (Admin or self).
- **Request body**: User update fields (e.g., `full_name`, `phone`).
- **Success response (200 OK)**: Updated user object.

### DELETE `/{id}`
- **Description**: Deactivate a user.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: `{ "message": "User deactivated" }`

### POST `/{id}/roles`
- **Description**: Assign a role to a user.
- **Auth required**: Yes (Admin).
- **Request body**: `{ "role_id": "string" }`
- **Success response (200 OK)**: Updated user roles.

### DELETE `/{id}/roles/{role_id}`
- **Description**: Remove a role from a user.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Updated user roles.

### POST `/{id}/departments`
- **Description**: Assign a user to a department.
- **Auth required**: Yes (Admin).
- **Request body**: `{ "department_id": "string" }`
- **Success response (200 OK)**: Updated user object.

---

## 3. DEPARTMENT ENDPOINTS (`/api/v1/departments`)

### GET `/`
- **Description**: List all departments.
- **Auth required**: Yes.
- **Success response (200 OK)**: Array of department objects.

### GET `/{id}`
- **Description**: Get department details including basic stats.
- **Auth required**: Yes.
- **Success response (200 OK)**: Department object with `document_count`, `user_count`.

### POST `/`
- **Description**: Create a new department.
- **Auth required**: Yes (Admin).
- **Request body**: `{ "name": "string", "description": "string" }`
- **Success response (201 Created)**: Department object.

### PUT `/{id}`
- **Description**: Update a department.
- **Auth required**: Yes (Admin).
- **Request body**: Fields to update.
- **Success response (200 OK)**: Updated department object.

### GET `/{id}/documents`
- **Description**: List documents belonging to a department.
- **Auth required**: Yes.
- **Query params**: Pagination parameters.
- **Success response (200 OK)**: Paginated document list.

### GET `/{id}/stats`
- **Description**: Get detailed department statistics.
- **Auth required**: Yes.
- **Success response (200 OK)**: Statistics object (storage used, queries, etc.).

---

## 4. DOCUMENT ENDPOINTS (`/api/v1/documents`)

### POST `/upload`
- **Description**: Upload a PDF document with metadata.
- **Auth required**: Yes (Admin, Contributor).
- **Content-Type**: `multipart/form-data`
- **Parameters**: `file` (Binary), `title` (string), `department_id` (string), `doc_type` (string), `language` (string).
- **Success response (201 Created)**: Document object containing `id` and `status`.

### GET `/`
- **Description**: List documents.
- **Auth required**: Yes.
- **Query params**: `page`, `per_page`, `department_id`, `type`, `language`, `status`, `date_from`, `date_to`.
- **Success response (200 OK)**: Paginated document list.

### GET `/{id}`
- **Description**: Get document metadata details.
- **Auth required**: Yes.
- **Success response (200 OK)**: Document object.

### GET `/{id}/download`
- **Description**: Download the original PDF document.
- **Auth required**: Yes.
- **Success response (200 OK)**: File stream (Content-Type: application/pdf).

### PUT `/{id}`
- **Description**: Update document metadata.
- **Auth required**: Yes (Admin, Contributor).
- **Request body**: Fields to update (e.g., `title`, `doc_type`).
- **Success response (200 OK)**: Updated document object.

### DELETE `/{id}`
- **Description**: Soft delete a document.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: `{ "message": "Document deleted" }`

### POST `/{id}/versions`
- **Description**: Upload a new version of an existing document.
- **Auth required**: Yes (Admin, Contributor).
- **Content-Type**: `multipart/form-data`
- **Success response (201 Created)**: New version metadata.

### GET `/{id}/versions`
- **Description**: List all versions of a document.
- **Auth required**: Yes.
- **Success response (200 OK)**: Array of version objects.

### GET `/{id}/chunks`
- **Description**: List text chunks extracted from a document.
- **Auth required**: Yes.
- **Success response (200 OK)**: Array of chunk objects.

---

## 5. PROCESSING ENDPOINTS (`/api/v1/processing`)

### POST `/documents/{id}/process`
- **Description**: Trigger or re-trigger document processing (OCR, chunking, embedding).
- **Auth required**: Yes (Admin, Contributor).
- **Success response (202 Accepted)**: `{ "message": "Processing started", "job_id": "uuid" }`

### GET `/documents/{id}/status`
- **Description**: Get the current processing status of a document.
- **Auth required**: Yes.
- **Success response (200 OK)**: `{ "status": "processing|completed|failed", "progress": 50, "error": null }`

### GET `/queue`
- **Description**: List the document processing queue.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Array of processing jobs.

---

## 6. CHAT ENDPOINTS (`/api/v1/chat`)

### POST `/sessions`
- **Description**: Create a new chat session.
- **Auth required**: Yes.
- **Request body**: `{ "title": "string?", "department_id": "string?" }`
- **Success response (201 Created)**: Session object.

### GET `/sessions`
- **Description**: List user's chat sessions.
- **Auth required**: Yes.
- **Success response (200 OK)**: Paginated session list.

### GET `/sessions/{id}`
- **Description**: Get session details.
- **Auth required**: Yes (Self).
- **Success response (200 OK)**: Session object.

### DELETE `/sessions/{id}`
- **Description**: Delete a chat session.
- **Auth required**: Yes (Self).
- **Success response (200 OK)**: `{ "message": "Session deleted" }`

### POST `/sessions/{id}/messages`
- **Description**: Send a message to the session and get an AI response.
- **Auth required**: Yes (Self).
- **Request body**: `{ "content": "Question here", "stream": false }`
- **Success response (200 OK)**: 
  ```json
  {
    "id": "uuid",
    "role": "assistant",
    "content": "Answer here",
    "sources": [ { "document_id": "uuid", "chunk_id": "uuid", "score": 0.95 } ]
  }
  ```
  *(If `stream=true`, returns Server-Sent Events)*

### GET `/sessions/{id}/messages`
- **Description**: Get message history for a session.
- **Auth required**: Yes (Self).
- **Success response (200 OK)**: Paginated messages array.

---

## 7. SEARCH ENDPOINTS (`/api/v1/search`)

### POST `/`
- **Description**: Perform a hybrid search across the knowledge base.
- **Auth required**: Yes.
- **Request body**:
  ```json
  {
    "query": "search query",
    "department_id": "uuid", // Optional
    "doc_type": "policy", // Optional
    "language": "en", // Optional
    "limit": 10 // Optional
  }
  ```
- **Success response (200 OK)**:
  ```json
  {
    "results": [
      {
        "document": { "id": "uuid", "title": "Doc Title" },
        "chunk_text": "Relevant text...",
        "score": 0.89
      }
    ]
  }
  ```

### GET `/suggestions`
- **Description**: Get search suggestions/autocomplete based on query.
- **Auth required**: Yes.
- **Query params**: `q` (string)
- **Success response (200 OK)**: `{ "suggestions": ["query 1", "query 2"] }`

---

## 8. FEEDBACK ENDPOINTS (`/api/v1/feedback`)

### POST `/`
- **Description**: Submit feedback for an AI response.
- **Auth required**: Yes.
- **Request body**:
  ```json
  {
    "message_id": "uuid",
    "rating": 1, // 1 (upvote) or -1 (downvote)
    "comment": "Helpful response" // Optional
  }
  ```
- **Success response (201 Created)**: Feedback object.

### GET `/`
- **Description**: List user feedback.
- **Auth required**: Yes (Admin).
- **Query params**: `rating`, `reviewed`.
- **Success response (200 OK)**: Paginated feedback list.

### PUT `/{id}/review`
- **Description**: Mark feedback as reviewed by an admin.
- **Auth required**: Yes (Admin).
- **Request body**: `{ "reviewed": true, "notes": "string" }`
- **Success response (200 OK)**: Updated feedback object.

---

## 9. ADMIN ENDPOINTS (`/api/v1/admin`)

### GET `/dashboard`
- **Description**: Get global dashboard statistics (total users, docs, queries).
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Dashboard stats object.

### GET `/analytics/queries`
- **Description**: Get query analytics (volume, popular topics).
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Analytics data object.

### GET `/analytics/departments`
- **Description**: Get departmental usage analytics.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Array of department stats.

### GET `/analytics/unanswered`
- **Description**: Get queries where the AI couldn't find an answer.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Array of unanswered queries.

### GET `/audit-logs`
- **Description**: Retrieve system audit logs.
- **Auth required**: Yes (Admin).
- **Query params**: Paginated, filterable by `action`, `user_id`, `date_range`.
- **Success response (200 OK)**: Paginated log entries.

### GET `/audit-logs/export`
- **Description**: Export audit logs as CSV.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: CSV file stream.

### GET `/settings`
- **Description**: Get system configuration settings.
- **Auth required**: Yes (Admin).
- **Success response (200 OK)**: Object of key-value pairs.

### PUT `/settings/{key}`
- **Description**: Update a specific system setting.
- **Auth required**: Yes (Admin).
- **Request body**: `{ "value": "new_value" }`
- **Success response (200 OK)**: Updated setting.

---

## 10. HEALTH ENDPOINT

### GET `/health`
- **Description**: System health check.
- **Auth required**: No.
- **Success response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "services": {
      "mysql": "connected",
      "qdrant": "connected",
      "ollama": "connected"
    }
  }
  ```
