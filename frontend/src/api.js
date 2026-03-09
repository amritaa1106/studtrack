import axios from 'axios';

const API_BASE_URL = 'https://studtrack.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout for registration (password hashing can take time)
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// User APIs
export const createUser = (userData) => api.post('/users/', userData);
export const getUser = (userId) => api.get(`/users/${userId}`);

// Study Session APIs
export const addStudySession = (sessionData) => {
  // FastAPI route expects query parameters
  return api.post('/study/add', null, { params: sessionData });
};
export const getStudySessions = (userId) => api.get(`/study/all/${userId}`);

// Grade APIs
export const addGrade = (gradeData) => api.post('/grades/', gradeData);
export const getGrades = (userId) => api.get(`/grades/${userId}`);

// Subject APIs
export const createSubject = (subjectData) => api.post('/subjects/', subjectData);
export const getSubjects = (userId) => api.get(`/subjects/${userId}`);

// ML Recommendation API
export const getMLRecommendations = (userId) => api.get(`/ml/recommend/${userId}`);

// Pomodoro APIs
export const createPomodoro = (pomodoroData) => api.post('/pomodoro/', pomodoroData);
export const getPomodoros = (userId) => api.get(`/pomodoro/${userId}`);
export const getCompletedPomodoros = (userId) => api.get(`/pomodoro/${userId}/completed`);
export const completePomodoro = (pomodoroId) => api.patch(`/pomodoro/${pomodoroId}/complete`);

// Todo APIs
export const createTodo = (todoData, userId) => api.post('/todos/', todoData, { params: { user_id: userId } });
export const getTodos = (userId) => api.get(`/todos/${userId}`);
export const getTodosByDate = (userId, date) => api.get(`/todos/${userId}/date/${date}`);
export const updateTodo = (todoId, todoData) => api.patch(`/todos/${todoId}`, todoData);
export const deleteTodo = (todoId) => api.delete(`/todos/${todoId}`);

// Auth APIs
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getCurrentUser = (token) => api.get('/auth/me', { params: { token } });

export default api;
