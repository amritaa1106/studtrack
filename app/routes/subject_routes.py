from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.subject import Subject
from pydantic import BaseModel

router = APIRouter(prefix="/subjects", tags=["Subjects"])

class SubjectCreate(BaseModel):
    subject_name: str
    difficulty_level: str
    user_id: int

@router.post("/")
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    new_subject = Subject(
        subject_name=subject.subject_name,
        difficulty_level=subject.difficulty_level,
        user_id=subject.user_id
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@router.get("/{user_id}")
def get_subjects(user_id: int, db: Session = Depends(get_db)):
    return db.query(Subject).filter(Subject.user_id == user_id).all()
