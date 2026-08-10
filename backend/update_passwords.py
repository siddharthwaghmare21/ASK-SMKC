import os
import sys

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def update_passwords():
    db = SessionLocal()
    try:
        new_password_hash = get_password_hash("Smkc_Secure_2026!")
        
        emails = ["admin@smkc.gov.in", "hod@smkc.gov.in", "user@smkc.gov.in"]
        for email in emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                user.password_hash = new_password_hash
                print(f"Updated password for {email}")
        
        db.commit()
        print("Successfully updated all dummy account passwords.")
    finally:
        db.close()

if __name__ == "__main__":
    update_passwords()
