import sys
import os

# Add the backend directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User, UserRole
from app.core import security

def seed_db():
    db: Session = SessionLocal()

    roles_data = [
        {"name": "admin", "display_name": "Administrator", "description": "System Admin", "level": 1},
        {"name": "hod", "display_name": "Head of Department", "description": "HOD", "level": 2},
        {"name": "user", "display_name": "Standard User", "description": "User", "level": 3},
    ]

    for role_data in roles_data:
        role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not role:
            role = Role(**role_data)
            db.add(role)
    db.commit()

    users_data = [
        {"email": "admin@smkc.gov.in", "full_name": "Admin User", "role": "admin"},
        {"email": "hod@smkc.gov.in", "full_name": "HOD User", "role": "hod"},
        {"email": "user@smkc.gov.in", "full_name": "Standard User", "role": "user"},
    ]

    for user_data in users_data:
        user = db.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                password_hash=security.get_password_hash("password123"),
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Assign role
            role = db.query(Role).filter(Role.name == user_data["role"]).first()
            if role:
                user_role = UserRole(user_id=user.id, role_id=role.id)
                db.add(user_role)
                db.commit()

    db.close()
    print("Database seeded successfully with roles and users.")

if __name__ == "__main__":
    seed_db()
