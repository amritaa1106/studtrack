from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.user import User
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    verify_token
)
import inspect
print("HASH FUNCTION FROM:", inspect.getfile(get_password_hash))

router = APIRouter(prefix="/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user directly"""
    import time
    start_time = time.time()
    
    try:
        # Validate password length first (fast check)
        if len(request.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Check if user already exists
        try:
            existing_user = db.query(User).filter(User.email == request.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        except Exception as db_error:
            # If database query fails, it's likely a connection issue
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Database query error: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database connection error. Please check if MySQL is running."
            )
        
        # Hash password (this is the slowest operation, but necessary for security)
        # Using optimized bcrypt rounds=8 for faster hashing
        hashed_password = get_password_hash(request.password)
        
        # Create user
        new_user = User(
            name=request.name,
            email=request.email,
            password=hashed_password
        )
        
        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
        except Exception as db_error:
            db.rollback()
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Database commit error: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to save user. Please check database connection."
            )
        
        # Create access token (fast operation)
        access_token = create_access_token(data={"sub": str(new_user.user_id), "email": new_user.email})
        
        elapsed_time = time.time() - start_time
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Registration completed in {elapsed_time:.2f}s for {request.email}")
        
        return {
            "message": "Registration successful",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": new_user.user_id,
                "name": new_user.name,
                "email": new_user.email
            }
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like email already exists)
        raise
    except Exception as e:
        # Log unexpected errors and return a user-friendly message
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user.user_id), "email": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email
        }
    }


@router.get("/me")
def get_current_user(token: str, db: Session = Depends(get_db)):
    """Get current user from token"""
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.user_id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email
    }
