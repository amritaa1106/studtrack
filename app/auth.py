
import os
import random
import string
import hashlib
import bcrypt
from datetime import datetime, timedelta
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.otp import OTP

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days


# ---------------- PASSWORD HASHING ---------------- #

def _password_prehash(password: str) -> bytes:
    """
    Pre-hash password using SHA256 so bcrypt length limit is never hit.
    Returns raw bytes (not hex string).
    """
    return hashlib.sha256(password.encode("utf-8")).digest()


def get_password_hash(password: str) -> str:
    """
    Hash password safely using:
    bcrypt( sha256(password) )
    """
    prehashed = _password_prehash(password)
    hashed = bcrypt.hashpw(prehashed, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password safely.
    """
    prehashed = _password_prehash(plain_password)
    return bcrypt.checkpw(prehashed, hashed_password.encode("utf-8"))


# ---------------- JWT TOKEN ---------------- #

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# ---------------- OTP SYSTEM ---------------- #

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))


def create_otp(db: Session, email: str) -> str:
    # Delete old OTPs
    db.query(OTP).filter(OTP.email == email).delete()

    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    otp = OTP(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at
    )

    db.add(otp)
    db.commit()
    db.refresh(otp)

    return otp_code


def verify_otp(db: Session, email: str, otp_code: str) -> bool:
    otp = db.query(OTP).filter(
        OTP.email == email,
        OTP.otp_code == otp_code,
        OTP.is_verified == False,
        OTP.expires_at > datetime.utcnow()
    ).first()

    if otp:
        otp.is_verified = True
        db.commit()
        return True

    return False


def send_otp_email(email: str, otp_code: str):
    print(f"\n{'='*60}")
    print(f"{' '*15}🔐 OTP VERIFICATION CODE 🔐")
    print(f"{'='*60}")
    print(f"📧 Email: {email}")
    print(f"🔑 OTP Code: {otp_code}")
    print(f"⏰ Valid for: 10 minutes")
    print(f"{'='*60}\n")

    return True

