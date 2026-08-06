from fastapi import APIRouter
from app.api.v1 import auth, documents, chat, settings, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(settings.router_settings, prefix="/settings", tags=["settings"])
api_router.include_router(settings.router_audit, prefix="/audit", tags=["audit"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
