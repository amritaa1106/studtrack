from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base



SQLALCHEMY_DATABASE_URL = "sqlite:///./studtrack.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
# Load .env file from project root
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. Please check your .env file.")

# Add connection timeout and pool settings to prevent hanging
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Set to False to reduce logging overhead
    connect_args={
        "connect_timeout": 10,  # Increased timeout
        "read_timeout": 10,
        "write_timeout": 10,
    },
    pool_pre_ping=True,  # Verify connections before using them
    pool_size=3,  # Reduced pool size
    max_overflow=5,  # Reduced overflow
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_timeout=20,  # Timeout for getting connection from pool
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()