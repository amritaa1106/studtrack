from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.grade import Grade
from pydantic import BaseModel

router = APIRouter(prefix="/grades", tags=["Grades"])

class GradeCreate(BaseModel):
    subject: str
    score: float
    max_score: float
    user_id: int

@router.post("/")
def create_grade(grade: GradeCreate, db: Session = Depends(get_db)):
    new_grade = Grade(**grade.dict())
    db.add(new_grade)
    db.commit()
    db.refresh(new_grade)
    return new_grade

@router.get("/{user_id}")
def get_grades(user_id: int, db: Session = Depends(get_db)):
    return db.query(Grade).filter(Grade.user_id == user_id).all()
