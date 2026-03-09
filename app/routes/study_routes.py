from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.study_session import StudySession

router = APIRouter(prefix="/study", tags=["Study Sessions"])


@router.post("/add")
def add_session(
    subject: str,
    duration: float,
    productivity: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    session = StudySession(
        subject=subject,
        duration=duration,
        productivity=productivity,
        user_id=user_id
    )
    db.add(session)
    db.commit() 
    db.refresh(session)
    return {"message": "Session added", "session_id": session.id}


@router.get("/all/{user_id}")
def get_sessions(user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(StudySession).filter(StudySession.user_id == user_id).all()
    return sessions