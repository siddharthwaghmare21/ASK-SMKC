import sys
sys.path.append('d:/SMKC/Smart SMKC/backend')

from app.api.v1.documents import process_and_store_document
from app.db.session import SessionLocal
from app.models.document import Document

db = SessionLocal()
doc = db.query(Document).get(4)
print(f"Processing doc 4: {doc.document_name}")
process_and_store_document(4, doc.file_path)
print("Finished!")
