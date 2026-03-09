import { useState, useEffect, useRef } from 'react';
import { createPomodoro, getCompletedPomodoros } from '../api';
import { Play, Pause, Square, RotateCcw, CheckCircle, Clock, History } from 'lucide-react';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

export default function Focus({ userId }) {
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('');
  const [completedPomodoros, setCompletedPomodoros] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    loadCompletedPomodoros();
  }, [userId]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const loadCompletedPomodoros = async () => {
    if (!userId) return;
    try {
      const response = await getCompletedPomodoros(userId);
      setCompletedPomodoros(response.data || []);
    } catch (error) {
      console.error('Error loading pomodoros:', error);
    }
  };

  const handleTimerComplete = async () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);

    if (!isBreak) {
      // Pomodoro completed
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      // Save completed pomodoro
      try {
        const duration = POMODORO_DURATION;
        await createPomodoro({
          user_id: userId,
          subject: currentSubject || 'General',
          duration: duration,
          completed: true,
        });
        loadCompletedPomodoros();
      } catch (error) {
        console.error('Error saving pomodoro:', error);
      }

      // Start break
      if (newCount % 4 === 0) {
        setTimeLeft(LONG_BREAK);
        setIsBreak(true);
      } else {
        setTimeLeft(SHORT_BREAK);
        setIsBreak(true);
      }
    } else {
      // Break completed, start new pomodoro
      setTimeLeft(POMODORO_DURATION);
      setIsBreak(false);
    }
  };

  const startTimer = () => {
    if (!sessionStarted && !currentSubject.trim()) {
      alert('Please enter a subject before starting!');
      return;
    }

    if (!sessionStarted) {
      setSessionStarted(true);
      startTimeRef.current = Date.now();
    }

    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(POMODORO_DURATION);
    setIsBreak(false);
    setSessionStarted(false);
    setCurrentSubject('');
    startTimeRef.current = null;
  };

  const skipBreak = () => {
    setTimeLeft(POMODORO_DURATION);
    setIsBreak(false);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((POMODORO_DURATION - timeLeft) / POMODORO_DURATION) * 100;
  const breakProgress = isBreak
    ? ((isBreak && pomodoroCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK) - timeLeft) /
      (pomodoroCount % 4 === 0 ? LONG_BREAK : SHORT_BREAK)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Pomodoro Focus Timer</h2>
        <p className="text-gray-600 mt-2">Stay focused and productive with the Pomodoro Technique</p>
      </div>

      {/* Main Timer Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Subject Input */}
          {!sessionStarted && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you focusing on?
              </label>
              <input
                type="text"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="e.g., Mathematics, Reading, Coding..."
              />
            </div>
          )}

          {/* Timer Display */}
          <div className="text-center mb-8">
            {sessionStarted && (
              <div className="mb-4">
                <span className="text-lg font-semibold text-gray-700">
                  {isBreak ? 'Break Time' : 'Focus Time'}
                </span>
                {currentSubject && (
                  <p className="text-sm text-gray-500 mt-1">Subject: {currentSubject}</p>
                )}
              </div>
            )}

            {/* Circular Progress */}
            <div className="relative inline-block">
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - (isBreak ? breakProgress : progress) / 100)}`}
                  className={`transition-all duration-1000 ${
                    isBreak ? 'text-green-500' : 'text-blue-500'
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${isBreak ? 'text-green-600' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {isBreak
                      ? pomodoroCount % 4 === 0
                        ? 'Long Break'
                        : 'Short Break'
                      : 'Focus Session'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Play className="w-5 h-5" />
                {sessionStarted ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}

            {sessionStarted && (
              <button
                onClick={resetTimer}
                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            )}

            {isBreak && (
              <button
                onClick={skipBreak}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Skip Break
              </button>
            )}
          </div>

          {/* Pomodoro Count */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">
                Completed: {pomodoroCount} Pomodoro{pomodoroCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pomodoro Technique Info */}
      <div className="max-w-2xl mx-auto bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Work for 25 minutes (one Pomodoro)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Take a 5-minute short break</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>After 4 Pomodoros, take a 15-minute long break</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Repeat and stay focused!</span>
          </li>
        </ul>
      </div>

      {/* Past Pomodoro Sessions */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Past Pomodoro Sessions
        </h3>
        {completedPomodoros.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No completed sessions yet.</p>
            <p className="text-sm mt-1">Complete a Pomodoro to see it here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedPomodoros.map((pomodoro) => (
              <div
                key={pomodoro.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {pomodoro.subject || 'General Focus'}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(pomodoro.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(pomodoro.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(pomodoro.duration / 60)} min
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
