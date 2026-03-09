import { useState, useEffect } from 'react';
import { getMLRecommendations } from '../api';
import { Brain, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function MLRecommendations({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMLRecommendations(userId);
      setRecommendations(response.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No study or grade data found for this user. Start tracking to get AI recommendations!');
      } else {
        setError('Failed to load recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High Priority':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'Medium Priority':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'Low Priority':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Brain className="w-6 h-6 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High Priority':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'Medium Priority':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'Low Priority':
        return 'bg-green-50 border-green-200 text-green-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'High Priority':
        return 'bg-red-100 text-red-800';
      case 'Medium Priority':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low Priority':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No recommendations available yet.</p>
        <p className="text-gray-400 text-sm mt-2">Add study sessions and grades to get AI-powered recommendations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
            <p className="text-blue-100 mt-1">
              Personalized subject focus recommendations based on your study patterns and grades
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recommendations.map((rec, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-sm p-6 border-2 ${getPriorityColor(rec.priority)} transition-transform hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPriorityIcon(rec.priority)}
                <h3 className="text-xl font-bold">{rec.subject}</h3>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(
                rec.priority
              )}`}>
                {rec.priority}
              </span>
            </div>

            <p className="text-sm mb-4 font-medium">{rec.reason}</p>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Study Time</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatTime(rec.total_study_time)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>Productivity</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {rec.average_productivity?.toFixed(1) || 'N/A'}/5
                </p>
              </div>
              {rec.grade_percentage !== null && (
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Grade Average</span>
                    <span className={`text-lg font-bold ${
                      rec.grade_percentage >= 80
                        ? 'text-green-600'
                        : rec.grade_percentage >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {rec.grade_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        rec.grade_percentage >= 80
                          ? 'bg-green-500'
                          : rec.grade_percentage >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(rec.grade_percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {recommendations.filter((r) => r.priority === 'High Priority').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">High Priority</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">
              {recommendations.filter((r) => r.priority === 'Medium Priority').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Medium Priority</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {recommendations.filter((r) => r.priority === 'Low Priority').length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Low Priority</p>
          </div>
        </div>
      </div>
    </div>
  );
}
