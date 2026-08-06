from app.db.session import engine, Base
from app.models.user import User
from app.models.department import Department
from app.models.document import Document
from app.models.audit import AuditLog
from app.models.chat import ChatSession, ChatMessage
from app.models.role import Role
from app.models.setting import Setting

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    init_db()
