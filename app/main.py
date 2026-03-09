from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine


# Import models so SQLAlchemy registers them
from app.models.user import User
from app.models.study_session import StudySession
from app.models.pomodoro_session import PomodoroSession
from app.models.grade import Grade
from app.models.goal import Goal
from app.models.todo import Todo

# Import routers
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.subject_routes import router as subject_router
from app.routes.grade_routes import router as grade_router
from app.routes.study_routes import router as study_router
from app.routes.ml_routes import ml_router
from app.routes.pomodoro_routes import router as pomodoro_router
from app.routes.todo_routes import router as todo_router


app = FastAPI(title="STUDTRACK")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
async def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Warning: Could not create database tables: {e}")


@app.get("/")
def root():
    return {"message": "STUDTRACK API running"}


# Include all routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(subject_router)
app.include_router(grade_router)
app.include_router(study_router)
app.include_router(ml_router)
app.include_router(pomodoro_router)
app.include_router(todo_router)