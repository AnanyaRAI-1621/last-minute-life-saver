import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export const Analytics = () => {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/analytics', token);
        setData(res);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Analyzing performance vectors...</span>
        </div>
      </div>
    );
  }

  // Calculate ratio
  const completionRate = data?.totalTasksCount > 0 
    ? Math.round((data.completedTasksCount / data.totalTasksCount) * 100)
    : 100;

  // Chart Palettes
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const DIFF_COLORS = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444'
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* Title */}
      <div className="p-6 rounded-2xl glass border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full filter blur-xl pointer-events-none" />
        <span className="text-[11px] font-black uppercase text-brand-600 dark:text-brand-400 tracking-wider flex items-center space-x-1">
          <BarChart3 className="h-3 w-3 text-brand-500" />
          <span>Productivity Metrics</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
          Review your progress.
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 max-w-lg">
          Analyze task completions, focus intervals, procrastination scores, and historical charts to identify productivity bottlenecks.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-950/30 rounded-xl text-brand-600 dark:text-brand-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Completion Rate</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{completionRate}%</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Focus Time</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{Math.round((data?.focusTimeMinutes || 0) / 60)} Hrs</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Overdue Count</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{data?.overdueTasksCount || 0}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Procrastination</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{data?.procrastinationScore || 0}%</h3>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Columns: 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col h-[380px]">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-4">7-Day Dynamic Task Load</h4>
          <div className="flex-1 min-h-0 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.completionTrend || []}>
                <defs>
                  <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#232d42" opacity={0.1}/>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#161c2a', borderColor: '#232d42', color: '#f3f4f6', borderRadius: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="Added" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdded)" />
                <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (Columns: 1) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col h-[380px]">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-4">Category Allocations</h4>
          <div className="flex-1 min-h-0 flex items-center justify-center text-xs">
            {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#161c2a', borderColor: '#232d42', color: '#f3f4f6', borderRadius: '12px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 italic">Create tasks to view distributions.</div>
            )}
          </div>
        </div>

        {/* Difficulty breakdown Bar Chart */}
        <div className="lg:col-span-3 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col h-[280px]">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-4">Task Difficulties Breakdowns</h4>
          <div className="flex-1 min-h-0 text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.difficultyDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232d42" opacity={0.1}/>
                <XAxis dataKey="name" stroke="#9ca3af" className="capitalize" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#161c2a', borderColor: '#232d42', color: '#f3f4f6', borderRadius: '12px' }} />
                <Bar dataKey="value" name="Tasks Count" radius={[10, 10, 0, 0]}>
                  {
                    (data?.difficultyDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DIFF_COLORS[entry.name.toLowerCase()] || '#6366f1'} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Analytics;
