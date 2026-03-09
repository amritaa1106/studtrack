from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.pomodoro_session import PomodoroSession
from pydantic import BaseModel

router = APIRouter(prefix="/pomodoro", tags=["Pomodoro"])


class PomodoroCreate(BaseModel):
    user_id: int
    subject: str
    duration: int
    completed: bool = False


@router.post("/")
def create_pomodoro(pomodoro: PomodoroCreate, db: Session = Depends(get_db)):
    new_pomodoro = PomodoroSession(**pomodoro.dict())
    db.add(new_pomodoro)
    db.commit()
    db.refresh(new_pomodoro)
    return new_pomodoro


@router.get("/{user_id}")
def get_pomodoros(user_id: int, db: Session = Depends(get_db)):
    """Get all pomodoro sessions for a user"""
    pomodoros = db.query(PomodoroSession).filter(PomodoroSession.user_id == user_id).order_by(PomodoroSession.timestamp.desc()).all()
    return pomodoros


@router.get("/{user_id}/completed")
def get_completed_pomodoros(user_id: int, db: Session = Depends(get_db)):
    """Get only completed pomodoro sessions"""
    pomodoros = db.query(PomodoroSession).filter(
        PomodoroSession.user_id == user_id,
        PomodoroSession.completed == True
    ).order_by(PomodoroSession.timestamp.desc()).all()
    return pomodoros


@router.patch("/{pomodoro_id}/complete")
def complete_pomodoro(pomodoro_id: int, db: Session = Depends(get_db)):
    pomodoro = db.query(PomodoroSession).filter(PomodoroSession.id == pomodoro_id).first()
    if not pomodoro:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pomodoro session not found")
    pomodoro.completed = True
    db.commit()
    db.refresh(pomodoro)
    return pomodoro
