from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, date
from app.database import get_db
from app.models.todo import Todo

router = APIRouter(prefix="/todos", tags=["Todos"])


class TodoCreate(BaseModel):
    title: str
    description: str = None
    due_date: datetime
    priority: str = "medium"


class TodoUpdate(BaseModel):
    title: str = None
    description: str = None
    due_date: datetime = None
    priority: str = None
    completed: bool = None


@router.post("/")
def create_todo(todo: TodoCreate, user_id: int, db: Session = Depends(get_db)):
    """Create a new todo"""
    new_todo = Todo(
        user_id=user_id,
        title=todo.title,
        description=todo.description,
        due_date=todo.due_date,
        priority=todo.priority
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo


@router.get("/{user_id}")
def get_todos(user_id: int, db: Session = Depends(get_db)):
    """Get all todos for a user"""
    todos = db.query(Todo).filter(Todo.user_id == user_id).order_by(Todo.due_date.asc()).all()
    return todos


@router.get("/{user_id}/date/{date_str}")
def get_todos_by_date(user_id: int, date_str: str, db: Session = Depends(get_db)):
    """Get todos for a specific date"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    todos = db.query(Todo).filter(
        Todo.user_id == user_id,
        func.date(Todo.due_date) == target_date
    ).order_by(Todo.priority.desc(), Todo.due_date.asc()).all()
    
    return todos


@router.patch("/{todo_id}")
def update_todo(todo_id: int, todo_update: TodoUpdate, db: Session = Depends(get_db)):
    """Update a todo"""
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    if todo_update.title is not None:
        todo.title = todo_update.title
    if todo_update.description is not None:
        todo.description = todo_update.description
    if todo_update.due_date is not None:
        todo.due_date = todo_update.due_date
    if todo_update.priority is not None:
        todo.priority = todo_update.priority
    if todo_update.completed is not None:
        todo.completed = todo_update.completed
    
    todo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """Delete a todo"""
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted successfully"}
