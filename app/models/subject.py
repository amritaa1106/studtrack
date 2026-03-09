from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    subject_id = Column(Integer, primary_key=True, index=True)
    subject_name = Column(String(100))   # IMPORTANT
    difficulty_level = Column(String(50))
    user_id = Column(Integer, ForeignKey("users.user_id"))