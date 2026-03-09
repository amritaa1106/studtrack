import { useState, useEffect } from 'react';
import { getStudySessions, getGrades, getMLRecommendations } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, TrendingUp, BookOpen, Award } from 'lucide-react';
import dashboardBg from "../assets/backgrounds/dashboard.png";
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export default function Dashboard({ userId }) {
  const [studySessions, setStudySessions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudyTime: 0,
    averageProductivity: 0,
    totalSessions: 0,
    averageGrade: 0,
  });

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, gradesRes, mlRes] = await Promise.all([
        getStudySessions(userId),
        getGrades(userId),
        getMLRecommendations(userId).catch(() => ({ data: [] })),
      ]);

      const sessions = sessionsRes.data || [];
      const gradesData = gradesRes.data || [];
      const mlData = mlRes.data || [];

      setStudySessions(sessions);
      setGrades(gradesData);
      setRecommendations(mlData);

      // Calculate stats
      const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const avgProd = sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.productivity || 0), 0) / sessions.length
        : 0;
      const avgGrade = gradesData.length > 0
        ? gradesData.reduce((sum, g) => sum + ((g.score / g.max_score) * 100 || 0), 0) / gradesData.length
        : 0;

      setStats({
        totalStudyTime: totalTime,
        averageProductivity: avgProd.toFixed(1),
        totalSessions: sessions.length,
        averageGrade: avgGrade.toFixed(1),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const studyTimeBySubject = studySessions.reduce((acc, session) => {
    const subject = session.subject || 'Unknown';
    acc[subject] = (acc[subject] || 0) + (session.duration || 0);
    return acc;
  }, {});

  const studyChartData = Object.entries(studyTimeBySubject).map(([subject, time]) => ({
    subject,
    time: Math.round(time),
  }));

  const productivityBySubject = studySessions.reduce((acc, session) => {
    const subject = session.subject || 'Unknown';
    if (!acc[subject]) {
      acc[subject] = { total: 0, count: 0 };
    }
    acc[subject].total += session.productivity || 0;
    acc[subject].count += 1;
    return acc;
  }, {});

  const productivityChartData = Object.entries(productivityBySubject).map(([subject, data]) => ({
    subject,
    productivity: (data.total / data.count).toFixed(1),
  }));

  const gradeChartData = grades.map((grade) => ({
    subject: grade.subject || 'Unknown',
    percentage: ((grade.score / grade.max_score) * 100).toFixed(1),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  

  return (
    
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title="Total Study Time"
          value={`${Math.round(stats.totalStudyTime)} min`}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Avg Productivity"
          value={stats.averageProductivity}
          color="purple"
        />
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Total Sessions"
          value={stats.totalSessions}
          color="green"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          title="Average Grade"
          value={`${stats.averageGrade}%`}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Time by Subject */}
        {studyChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Study Time by Subject</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="time" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Productivity by Subject */}
        {productivityChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Average Productivity by Subject</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={productivityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="productivity" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Grades Distribution */}
        {gradeChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grade Percentage by Subject</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="percentage" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ML Recommendations Preview */}
        {recommendations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Recommendations Priority</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={recommendations.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ subject, priority }) => `${subject}: ${priority}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="grade_percentage"
                >
                  {recommendations.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Recommendations</h3>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'High Priority'
                    ? 'bg-red-50 border-red-500'
                    : rec.priority === 'Medium Priority'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.subject}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-white">
                    {rec.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {studySessions.length === 0 && grades.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No data available yet. Start tracking your study sessions and grades!</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}
