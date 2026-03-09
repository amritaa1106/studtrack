from typing import List, Dict, Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.study_session import StudySession
from app.models.grade import Grade


def get_subject_recommendations(user_id: int, db: Session) -> List[Dict[str, Any]]:
    """
    Analyze a user's study sessions and grades and recommend which subjects
    need more focus.

    For each subject, we compute:
    - total_study_time: Sum of all study durations for that subject
    - average_productivity: Average productivity score for that subject
    - grade_percentage: Average (score / max_score) * 100 for that subject

    Priority rules:
    - grade < 60                -> "High Priority"      (Low academic performance)
    - 60 <= grade <= 75         -> "Medium Priority"    (Moderate performance)
    - grade > 75                -> "Low Priority"       (Good performance)
    - If grade > 75 AND total_study_time is very low,
      we still recommend more consistency.

    Returns a list of dictionaries ready to be serialized as JSON.
    """

    # --- Aggregate study session data per subject ---
    study_aggregates = (
        db.query(
            StudySession.subject.label("subject"),
            func.coalesce(func.sum(StudySession.duration), 0).label("total_study_time"),
            func.coalesce(func.avg(StudySession.productivity), 0).label("average_productivity"),
        )
        .filter(StudySession.user_id == user_id)
        .group_by(StudySession.subject)
        .all()
    )

    # --- Aggregate grade data per subject ---
    # Compute grade percentage as (score / max_score) * 100, then average per subject.
    grade_aggregates = (
        db.query(
            Grade.subject.label("subject"),
            func.avg((Grade.score / Grade.max_score) * 100).label("grade_percentage"),
        )
        .filter(
            Grade.user_id == user_id,
            Grade.max_score > 0,  # avoid division by zero
        )
        .group_by(Grade.subject)
        .all()
    )

    if not study_aggregates and not grade_aggregates:
        # No relevant data at all for this user; let the route layer decide how to surface this.
        raise ValueError("No study or grade data found for this user.")

    # Index aggregates by subject name for easy merging
    subjects_data: Dict[str, Dict[str, Any]] = {}

    for row in study_aggregates:
        subject_name = row.subject or "Unknown"
        subjects_data.setdefault(subject_name, {})
        subjects_data[subject_name].update(
            {
                "subject": subject_name,
                "total_study_time": float(row.total_study_time or 0.0),
                "average_productivity": float(row.average_productivity or 0.0),
            }
        )

    for row in grade_aggregates:
        subject_name = row.subject or "Unknown"
        subjects_data.setdefault(subject_name, {})
        # grade_percentage can be None if there is no valid score/max_score yet
        grade_percentage = float(row.grade_percentage) if row.grade_percentage is not None else None
        subjects_data[subject_name].update(
            {
                "subject": subject_name,
                "grade_percentage": grade_percentage,
            }
        )

    # Ensure all required fields exist with sensible defaults
    for subject_name, data in subjects_data.items():
        data.setdefault("subject", subject_name)
        data.setdefault("total_study_time", 0.0)
        data.setdefault("average_productivity", 0.0)
        data.setdefault("grade_percentage", None)

    recommendations: List[Dict[str, Any]] = []

    # Define what "very low" study time means (in minutes, assuming duration is minutes)
    VERY_LOW_STUDY_TIME_THRESHOLD = 60.0  # e.g., less than 1 hour total

    for subject_name, data in subjects_data.items():
        total_study_time = data["total_study_time"]
        grade_percentage = data["grade_percentage"]

        # Default values
        priority = "Insufficient Data"
        reason = "Not enough information to assess this subject yet."

        if grade_percentage is not None:
            # Apply the main grade-based rules
            if grade_percentage < 60:
                priority = "High Priority"
                reason = "Low academic performance"
            elif 60 <= grade_percentage <= 75:
                priority = "Medium Priority"
                reason = "Moderate academic performance"
            else:  # grade > 75
                # Check for high grade but very low study time
                if total_study_time < VERY_LOW_STUDY_TIME_THRESHOLD:
                    priority = "Medium Priority"
                    reason = "High grades but very low study time – aim for more consistent focus"
                else:
                    priority = "Low Priority"
                    reason = "High academic performance"
        else:
            # No grade data but some study data exists
            if total_study_time > 0:
                priority = "Medium Priority"
                reason = "Study data available but no grades yet – monitor performance"

        recommendations.append(
            {
                "subject": data["subject"],
                "total_study_time": data["total_study_time"],
                "average_productivity": data["average_productivity"],
                "grade_percentage": grade_percentage,
                "priority": priority,
                "reason": reason,
            }
        )

    # Sort recommendations so the most critical subjects appear first:
    # High Priority -> Medium Priority -> Low Priority -> Insufficient Data
    priority_order = {
        "High Priority": 0,
        "Medium Priority": 1,
        "Low Priority": 2,
        "Insufficient Data": 3,
    }

    recommendations.sort(
        key=lambda item: (
            priority_order.get(item["priority"], 99),
            # For tie-breaking, lower grade first; if grade is None, push it to the end.
            item["grade_percentage"] if item["grade_percentage"] is not None else 1e9,
        )
    )

    return recommendations

