from pydantic import BaseModel

class StudySessionCreate(BaseModel):
    user_id: int
    subject: str
    duration: float
    productivity: int