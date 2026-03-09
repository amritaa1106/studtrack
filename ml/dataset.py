import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

def load_dataset():
    query = """
    SELECT 
        s.subject,
        AVG(s.duration) as avg_duration,
        AVG(s.productivity) as avg_productivity,
        COUNT(s.id) as sessions,
        AVG(g.score / g.max_score) as grade_ratio
    FROM study_sessions s
    LEFT JOIN grades g ON s.subject = g.subject
    GROUP BY s.subject
    """
    return pd.read_sql(query, engine)