# STUDTRACK - AI-Powered Student Productivity Tracker

A comprehensive full-stack application for tracking study sessions, grades, and getting AI-powered recommendations for subject focus.

## Features

- 📊 **Dashboard** - Visual overview of study statistics and performance
- 📚 **Study Session Tracker** - Log study time and productivity
- 📝 **Grade Tracker** - Record and monitor academic performance
- 🤖 **AI Recommendations** - ML-powered subject focus recommendations
- 📈 **Charts & Visualizations** - Beautiful data visualizations using Recharts
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## Tech Stack

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- MySQL Database
- Machine Learning recommendations

### Frontend
- React 18
- Vite
- Tailwind CSS
- Recharts
- Axios

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- MySQL Database

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure database:**
   - Create a `.env` file in the root directory
   - Add your MySQL connection string:
   ```
   DATABASE_URL=mysql+pymysql://username:password@localhost:3306/studtrack
   ```

3. **Run the backend:**
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Users
- `POST /users/` - Create a new user
- `GET /users/{user_id}` - Get user details

### Study Sessions
- `POST /study/add` - Add a study session
- `GET /study/all/{user_id}` - Get all study sessions for a user

### Grades
- `POST /grades/` - Add a grade
- `GET /grades/{user_id}` - Get all grades for a user

### Subjects
- `POST /subjects/` - Create a subject
- `GET /subjects/{user_id}` - Get all subjects for a user

### ML Recommendations
- `GET /ml/recommend/{user_id}` - Get AI-powered subject recommendations

## Usage

1. **Start both servers** (backend and frontend)
2. **Open the frontend** in your browser (`http://localhost:5173`)
3. **Set your User ID** in the header (default is 1)
4. **Add study sessions** and **grades** to start tracking
5. **View AI recommendations** in the ML Recommendations tab

## ML Recommendation Logic

The system analyzes:
- Total study time per subject
- Average productivity per subject
- Average grade percentage per subject

Priority levels:
- **High Priority**: Grade < 60% (Low academic performance)
- **Medium Priority**: Grade 60-75% (Moderate performance) OR High grade but very low study time
- **Low Priority**: Grade > 75% (Good performance)

## Project Structure

```
STUDTRACK/
├── app/
│   ├── main.py              # FastAPI application
│   ├── database.py          # Database configuration
│   ├── models/              # SQLAlchemy models
│   ├── routes/              # API routes
│   └── ml/                  # ML recommendation module
│       └── recommender.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx          # Main app component
│   │   └── api.js           # API client
│   └── package.json
└── requirements.txt
```

## Development

- Backend runs on port 8000
- Frontend runs on port 5173 (Vite default)
- CORS is configured to allow frontend-backend communication
- Hot reload enabled for both servers

## License

MIT
