import os
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from app.core.config import settings
import uuid

# Initialize Qdrant client based on config
if settings.USE_LOCAL_QDRANT:
    # Use local file storage (for development without Docker)
    QDRANT_STORAGE_DIR = "storage/qdrant_data"
    os.makedirs(QDRANT_STORAGE_DIR, exist_ok=True)
    qdrant_client = QdrantClient(path=QDRANT_STORAGE_DIR)
else:
    # Use remote Qdrant server (for Docker/production)
    qdrant_client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

# Initialize Embedding Model
# BAAI/bge-m3 is a large multilingual model. 
# It handles English, Hindi, and Marathi very well.
try:
    embedding_model = SentenceTransformer("BAAI/bge-m3")
except Exception:
    # Fallback to a smaller model if bge-m3 fails or takes too long to download in dev
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

from fastembed import SparseTextEmbedding

# Initialize Sparse Embedding Model (BM25 equivalent)
try:
    sparse_embedding_model = SparseTextEmbedding(model_name="Qdrant/bm25")
except Exception:
    print("Warning: Failed to load fastembed sparse model.")
    sparse_embedding_model = None

def init_qdrant_collection():
    """Ensure the Qdrant collection exists with both dense and sparse vectors."""
    collections = qdrant_client.get_collections().collections
    if not any(c.name == settings.QDRANT_COLLECTION for c in collections):
        dimension = embedding_model.get_sentence_embedding_dimension()
        
        # Dense vector config
        vectors_config = VectorParams(size=dimension, distance=Distance.COSINE)
        
        # Sparse vector config
        from qdrant_client.http.models import SparseVectorParams
        sparse_vectors_config = {
            "sparse": SparseVectorParams()
        }
        
        qdrant_client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=vectors_config,
            sparse_vectors_config=sparse_vectors_config
        )

def generate_embeddings_and_store(chunks: List[Dict[str, Any]], document_metadata: Dict[str, Any]):
    """
    Generates embeddings (dense and sparse) for a list of chunks and stores them in Qdrant.
    """
    init_qdrant_collection()
    
    # Pre-compute sparse embeddings if available
    texts = [chunk["text"] for chunk in chunks]
    sparse_embeddings_list = []
    if sparse_embedding_model:
        # fastembed returns an iterator of SparseEmbedding objects
        sparse_embeddings = list(sparse_embedding_model.embed(texts))
        for se in sparse_embeddings:
            # fastembed format: se.values and se.indices
            from qdrant_client.http.models import SparseVector
            sparse_embeddings_list.append(SparseVector(
                indices=se.indices.tolist(),
                values=se.values.tolist()
            ))
    
    points = []
    for i, chunk in enumerate(chunks):
        text = chunk["text"]
        # Generate dense embedding
        dense_vector = embedding_model.encode(text).tolist()
        
        # Prepare sparse vector
        sparse_vector_map = {}
        if sparse_embeddings_list:
            sparse_vector_map["sparse"] = sparse_embeddings_list[i]
        
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
        
        # Create point with dense and sparse vectors
        # In Qdrant python client, if we have named vectors, we can pass a dict to 'vector'
        # BUT our dense vector is UNNAMED (the default), and our sparse is named "sparse"
        # The syntax is: vector={"": dense_vector, "sparse": sparse_vector}
        vector_payload = {"": dense_vector}
        if sparse_vector_map:
            vector_payload["sparse"] = sparse_vector_map["sparse"]
            
        points.append(PointStruct(id=point_id, vector=vector_payload, payload=payload))
        
    if points:
        qdrant_client.upsert(
            collection_name=settings.QDRANT_COLLECTION,
            points=points
        )
