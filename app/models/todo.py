from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from datetime import datetime
from app.database import Base


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    title = Column(String(200))
    description = Column(Text, nullable=True)
    due_date = Column(DateTime)
    completed = Column(Boolean, default=False)
    priority = Column(String(20), default="medium")  # low, medium, high
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
