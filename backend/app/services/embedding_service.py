import os
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from app.core.config import settings
import uuid

# Use Local Qdrant Storage to avoid requiring Docker
QDRANT_STORAGE_DIR = "storage/qdrant_data"
os.makedirs(QDRANT_STORAGE_DIR, exist_ok=True)

# Initialize Qdrant local client
qdrant_client = QdrantClient(path=QDRANT_STORAGE_DIR)

# Initialize Embedding Model
# BAAI/bge-m3 is a large multilingual model. 
# It handles English, Hindi, and Marathi very well.
try:
    embedding_model = SentenceTransformer("BAAI/bge-m3")
except Exception:
    # Fallback to a smaller model if bge-m3 fails or takes too long to download in dev
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def init_qdrant_collection():
    """Ensure the Qdrant collection exists."""
    collections = qdrant_client.get_collections().collections
    if not any(c.name == settings.QDRANT_COLLECTION for c in collections):
        # bge-m3 dense vector dimension is 1024. all-MiniLM-L6-v2 is 384.
        # Determine dimension based on loaded model
        dimension = embedding_model.get_sentence_embedding_dimension()
        qdrant_client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=dimension, distance=Distance.COSINE),
        )

def generate_embeddings_and_store(chunks: List[Dict[str, Any]], document_metadata: Dict[str, Any]):
    """
    Generates embeddings for a list of chunks and stores them in Qdrant.
    """
    init_qdrant_collection()
    
    points = []
    for i, chunk in enumerate(chunks):
        text = chunk["text"]
        # Generate dense embedding
        dense_vector = embedding_model.encode(text).tolist()
        
        # Prepare payload
        payload = {
            "text": text,
            "document_id": document_metadata.get("id"),
            "document_name": document_metadata.get("document_name"),
            "department_id": document_metadata.get("department_id"),
            "document_type": document_metadata.get("document_type"),
            "language": document_metadata.get("language"),
            "section_number": chunk.get("section", "Unknown"),
            "page_numbers": chunk.get("pages", []),
            "chunk_index": i
        }
        
        point_id = str(uuid.uuid4())
        points.append(PointStruct(id=point_id, vector=dense_vector, payload=payload))
        
    if points:
        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=points
        )
