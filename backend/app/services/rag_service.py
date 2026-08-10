import json
import requests
from typing import List, Dict, Any, Tuple
from app.services.embedding_service import qdrant_client, embedding_model
from app.core.config import settings
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

# Define Ollama endpoint from config
OLLAMA_API_URL = settings.OLLAMA_API_URL
MODEL_NAME = "qwen2.5:7b"

SYSTEM_PROMPT = """
You are ASK SMKC, the Municipal AI Knowledge Management System.
You are an expert assistant for Municipal Corporation operations.

STRICT RULES:
1. You may use the provided context documents to answer the question, but if the context documents do not contain the answer, you are ALLOWED to use your general knowledge about municipal rules, acts, and procedures to answer the question.
2. If the user's question is entirely unrelated to municipal affairs, governance, public services, or administration, you MUST refuse to answer and instead state:
   "I am the ASK SMKC Municipal Knowledge Assistant. I can only assist with queries related to municipal rules, acts, and procedures."
3. Support English, Hindi, and Marathi queries.
4. Respond in the same language as the question.
5. Be precise, professional, and factual.

CITATION FORMAT:
If you used the provided context documents, always cite the source at the end:
Source: [Document Name] | Section: [Section] | Page: [Pages]
"""

def retrieve_context(query: str, top_k: int = 5, department_id: int = None) -> List[Dict[str, Any]]:
    """Retrieve relevant chunks from Qdrant using Hybrid Search."""
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
        
    from app.services.embedding_service import sparse_embedding_model
    from qdrant_client.http.models import NamedVector
    from qdrant_client.http.models import SparseVector
    
    if sparse_embedding_model:
        # Generate sparse vector for query
        sparse_result = list(sparse_embedding_model.query_embed(query))[0]
        sparse_vector = SparseVector(
            indices=sparse_result.indices.tolist(),
            values=sparse_result.values.tolist()
        )
        
        # Hybrid search using Qdrant's multiple query_points or prefetch
        # But wait, Qdrant client 1.7+ supports passing both vectors via prefetch
        # Let's use the simplest approach for now since fastembed handles it well.
        # Actually, if we just want to retrieve from the sparse index too:
        try:
            from qdrant_client.http.models import Prefetch
            prefetch = [
                Prefetch(query=query_vector, limit=top_k),
                Prefetch(query=sparse_vector, using="sparse", limit=top_k)
            ]
            search_result = qdrant_client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                prefetch=prefetch,
                query=query_vector, # Fallback/fusion query
                query_filter=query_filter,
                limit=top_k
            ).points
        except Exception as e:
            print(f"Hybrid search failed, falling back to dense only: {e}")
            search_result = qdrant_client.query_points(
                collection_name=settings.QDRANT_COLLECTION,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k
            ).points
    else:
        search_result = qdrant_client.query_points(
            collection_name=settings.QDRANT_COLLECTION,
            query=query_vector,
            query_filter=query_filter,
            limit=top_k
        ).points
    
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

def query_ollama(prompt: str):
    """Send prompt to local Ollama instance and yield stream chunks."""
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "system": SYSTEM_PROMPT,
        "stream": True,
        "temperature": 0.1
    }
    try:
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=300, stream=True)
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line)
                if "response" in chunk:
                    yield chunk["response"]
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama: {e}")
        yield "Error: AI engine (Ollama) is currently unreachable. Please ensure it is running."

def generate_answer(query: str, department_id: int = None):
    """Retrieves context and yields an answer stream followed by citations."""
    chunks = retrieve_context(query, department_id=department_id)
         
    context_str = format_context(chunks) if chunks else "No official municipal documents found for this query. Use your general municipal knowledge if applicable."
    
    prompt = f"CONTEXT DOCUMENTS:\n{context_str}\n\nUSER QUESTION:\n{query}\n\nANSWER:"
    
    for chunk_text in query_ollama(prompt):
        yield {"type": "chunk", "text": chunk_text}
    
    # Store citations
    citations_data = [{
        "document_name": c.get("document_name"),
        "section": c.get("section_number"),
        "pages": c.get("page_numbers")
    } for c in chunks]
    
    yield {"type": "citations", "data": citations_data}
