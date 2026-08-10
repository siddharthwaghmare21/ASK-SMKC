from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import json
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import ChatSessionCreate, ChatSessionResponse, ChatSessionUpdate, ChatMessageCreate, ChatMessageResponse
from app.services import rag_service

router = APIRouter()

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    session_in: ChatSessionCreate,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Create a new chat session."""
    session = ChatSession(
        title=session_in.title,
        user_id=None
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Get all chat sessions. (In a real app without auth, this might be filtered by a client cookie/localstorage id)"""
    sessions = db.query(ChatSession).offset(skip).limit(limit).all()
    return sessions

@router.post("/sessions/{session_id}/messages")
def send_message(
    session_id: int,
    message_in: ChatMessageCreate,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Send a message to a session and get AI response stream."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=message_in.content
    )
    db.add(user_msg)
    
    # Save empty AI message
    ai_msg = ChatMessage(
        session_id=session.id,
        role="ai",
        content="",
        citations="[]"
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    def event_stream():
        full_content = ""
        citations = "[]"
        yield f"data: {json.dumps({'type': 'init', 'id': ai_msg.id})}\n\n"
        
        for item in rag_service.generate_answer(message_in.content, message_in.department_id):
            if item["type"] == "chunk":
                full_content += item["text"]
            elif item["type"] == "citations":
                citations = json.dumps(item["data"])
            yield f"data: {json.dumps(item)}\n\n"
            
        ai_msg.content = full_content
        ai_msg.citations = citations
        db.commit()
        
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: int,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Get all messages for a specific session."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.id.asc()).all()
    return messages

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Delete a chat session and all its messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    db.delete(session)
    db.commit()
    return {"status": "success"}

@router.put("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session(
    session_id: int,
    session_in: ChatSessionUpdate,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Update a chat session title."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.title = session_in.title
    db.commit()
    db.refresh(session)
    return session

@router.put("/sessions/{session_id}/messages/{message_id}")
def edit_message(
    session_id: int,
    message_id: int,
    message_in: ChatMessageCreate,
    db: Session = Depends(deps.get_db)
) -> Any:
    """Edit a user message and generate a new AI response stream. This deletes all subsequent messages."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    user_msg = db.query(ChatMessage).filter(ChatMessage.id == message_id, ChatMessage.session_id == session.id).first()
    if not user_msg or user_msg.role != "user":
        raise HTTPException(status_code=404, detail="User message not found")
        
    # Delete all messages that came after this message
    db.query(ChatMessage).filter(ChatMessage.session_id == session.id, ChatMessage.id > message_id).delete()
    
    # Update the user message content
    user_msg.content = message_in.content
    
    # Save empty AI message
    ai_msg = ChatMessage(
        session_id=session.id,
        role="ai",
        content="",
        citations="[]"
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)
    
    def event_stream():
        full_content = ""
        citations = "[]"
        yield f"data: {json.dumps({'type': 'init', 'id': ai_msg.id})}\n\n"
        
        for item in rag_service.generate_answer(message_in.content, message_in.department_id):
            if item["type"] == "chunk":
                full_content += item["text"]
            elif item["type"] == "citations":
                citations = json.dumps(item["data"])
            yield f"data: {json.dumps(item)}\n\n"
            
        ai_msg.content = full_content
        ai_msg.citations = citations
        db.commit()
        
    return StreamingResponse(event_stream(), media_type="text/event-stream")
