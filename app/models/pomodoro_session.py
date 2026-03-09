from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from datetime import datetime
from app.database import Base

class PomodoroSession(Base):
    __tablename__ = "pomodoro_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    subject = Column(String(100))
    duration = Column(Integer)
    completed = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
