from app.db.session import SessionLocal
from app.models.user import User, UserRole, AuthProvider
from app.models.role import Role
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # Create default admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="System Administrator")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)

        # Create default admin user
        admin = db.query(User).filter(User.email == "admin@smkc.gov.in").first()
        if not admin:
            admin = User(
                email="admin@smkc.gov.in",
                password_hash=get_password_hash("admin123"),
                full_name="System Admin",
                is_active=True,
                auth_provider=AuthProvider.local
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

            # Assign role
            user_role = UserRole(user_id=admin.id, role_id=admin_role.id)
            db.add(user_role)
            db.commit()
            
            print("Default admin created: admin@smkc.gov.in / admin123")
        else:
            print("Admin user already exists.")
    except Exception as e:
        print(f"Error seeding DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
