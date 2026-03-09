from sqlalchemy import Column, Integer, String, ForeignKey, Float
from app.database import Base

class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True)
    subject = Column(String(100))
    score = Column(Float)
    max_score = Column(Float)
    user_id = Column(Integer, ForeignKey("users.user_id"))
