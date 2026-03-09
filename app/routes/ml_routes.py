from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml.recommender import get_subject_recommendations


ml_router = APIRouter(prefix="/ml", tags=["Machine Learning"])


@ml_router.get("/recommend/{user_id}")
def recommend_subjects(user_id: int, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get subject-focus recommendations for a given user.

    Example response:
    [
        {
            "subject": "Math",
            "total_study_time": 200,
            "average_productivity": 3.8,
            "grade_percentage": 58,
            "priority": "High Priority",
            "reason": "Low academic performance"
        }
    ]
    """
    try:
        recommendations = get_subject_recommendations(user_id=user_id, db=db)
    except ValueError as exc:
        # No data available for this user; return a clear 404 response.
        raise HTTPException(status_code=404, detail=str(exc))

    return recommendations

