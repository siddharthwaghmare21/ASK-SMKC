import json
import requests
from typing import List, Dict, Any, Tuple
from app.services.embedding_service import qdrant_client, embedding_model
from app.core.config import settings
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

# Define Ollama endpoint
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:7b"

SYSTEM_PROMPT = """
You are MAIKMS, the Municipal AI Knowledge Management System.
You are an expert assistant for Municipal Corporation operations.

STRICT RULES:
1. Answer ONLY from the provided context documents.
2. NEVER invent, assume, or fabricate any law, section, or rule.
3. ALWAYS cite the source document name, section number, and page number using the format below.
4. If the information is not in the provided context, respond:
   "यह जानकारी उपलब्ध आधिकारिक दस्तावेजों में नहीं मिली। This information was not found in the available official documents."
5. Support English, Hindi, and Marathi queries.
6. Respond in the same language as the question.
7. Be precise, professional, and factual.

CITATION FORMAT:
Source: [Document Name] | Section: [Section] | Page: [Pages]
"""

def retrieve_context(query: str, top_k: int = 5, department_id: int = None) -> List[Dict[str, Any]]:
    """Retrieve relevant chunks from Qdrant."""
    # Ensure collection exists, if it doesn't it will throw an error, but let's assume Phase 4 ran.
    query_vector = embedding_model.encode(query).tolist()
    
    query_filter = None
    if department_id:
        query_filter = Filter(
            must=[
                FieldCondition(
                    key="department_id",
                    match=MatchValue(value=department_id)
                )
            ]
        )
        
    search_result = qdrant_client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=query_vector,
        query_filter=query_filter,
        limit=top_k
    )
    
    chunks = []
    for hit in search_result:
        chunks.append(hit.payload)
    return chunks

def format_context(chunks: List[Dict[str, Any]]) -> str:
    """Format chunks into a string for the LLM."""
    context_parts = []
    for chunk in chunks:
        doc_name = chunk.get("document_name", "Unknown Document")
        section = chunk.get("section_number", "Unknown")
        pages = chunk.get("page_numbers", [])
        text = chunk.get("text", "")
        context_parts.append(f"[Document: {doc_name} | Section: {section} | Pages: {pages}]\n{text}\n")
    return "\n\n".join(context_parts)

def query_ollama(prompt: str) -> str:
    """Send prompt to local Ollama instance."""
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": False,
        "temperature": 0.1
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=60)
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama: {e}")
        return "Error: AI engine (Ollama) is currently unreachable. Please ensure it is running."

def generate_answer(query: str, department_id: int = None) -> Tuple[str, str]:
    """Retrieves context and generates an answer with citations."""
    chunks = retrieve_context(query, department_id=department_id)
    if not chunks:
         return "This information was not found in the available official documents.", "[]"
         
    context_str = format_context(chunks)
    
    prompt = f"CONTEXT DOCUMENTS:\n{context_str}\n\nUSER QUESTION:\n{query}\n\nANSWER:"
    
    answer = query_ollama(prompt)
    
    # Store citations as a JSON string of the retrieved chunks
    citations_json = json.dumps([{
        "document_name": c.get("document_name"),
        "section": c.get("section_number"),
        "pages": c.get("page_numbers")
    } for c in chunks])
    
    return answer, citations_json
