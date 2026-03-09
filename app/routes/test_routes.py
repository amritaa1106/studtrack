from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models.user import User
from app.auth import get_password_hash
import time

router = APIRouter(prefix="/test", tags=["Testing"])


@router.get("/db")
def test_database(db: Session = Depends(get_db)):
    """Test database connection"""
    try:
        start = time.time()
        result = db.execute("SELECT 1")
        elapsed = time.time() - start
        return {
            "status": "connected",
            "response_time": f"{elapsed:.3f}s",
            "message": "Database connection successful"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Database connection failed"
        }


@router.get("/hash")
def test_password_hashing():
    """Test password hashing speed"""
    try:
        start = time.time()
        hash_result = get_password_hash("testpassword123")
        elapsed = time.time() - start
        return {
            "status": "success",
            "hash_time": f"{elapsed:.3f}s",
            "hash_length": len(hash_result),
            "message": "Password hashing test completed"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "message": "Password hashing failed"
        }
