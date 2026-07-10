import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Flame, 
  ArrowRight,
  Zap,
  Play
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export const Dashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeRecIndex, setActiveRecIndex] = useState(0);

  // Recommendations generator
  const recommendations = [
    { title: 'DSA Practice Sprint', text: 'Completing questions 1 to 3 of DSA Assignment now will cut your evening workload by 60%.' },
    { title: 'Focus Sprint Suggestion', text: 'You skipped 2 sessions. Start a 15-minute high-focus sprint now to recover.' },
    { title: 'Tackle the Hard Stuff First', text: 'Working on "Interview Prep" during your peak hours (6-8 PM) increases retention by 30%.' },
    { title: 'Procrastination Recovery', text: 'Dynamic priority score for your pending project has reached 88. Start before risk triggers emergency mode.' }
  ];

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const tasksData = await api.get('/api/tasks', token);
        const analyticsData = await api.get('/api/analytics', token);
        
        setTasks(tasksData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Rotate recommendations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRecIndex(prev => (prev + 1) % recommendations.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Running Proactive Diagnostics...</span>
        </div>
      </div>
    );
  }

  // Calculate status counters
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const dueTodayTasks = pendingTasks.filter(t => {
    const d = new Date(t.deadline);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const overdueTasks = pendingTasks.filter(t => new Date(t.deadline) < new Date());

  // Aggregate deadline risk
  const maxRisk = pendingTasks.length > 0 
    ? Math.max(...pendingTasks.map(t => t.deadlineRisk || 0)) 
    : 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome & AI Quick Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Welcome Block */}
        <div className="flex-1 p-6 rounded-2xl glass border border-white/10 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full filter blur-xl pointer-events-none" />
          <div>
            <span className="text-[11px] font-black uppercase text-brand-600 dark:text-brand-400 tracking-wider flex items-center space-x-1">
              <Zap className="h-3 w-3 fill-brand-500" />
              <span>AI Companion Online</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              Stay ahead, avoid the crunch.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 max-w-lg">
              Your priority score calculates urgency and procrastination penalty in real time. Focus on high-risk items first.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/tasks"
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm shadow-brand-500/20"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/planner"
              className="bg-white hover:bg-gray-50 dark:bg-dark-input dark:hover:bg-dark-border text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-dark-border text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              <span>Generate Today's Plan</span>
            </Link>
          </div>
        </div>

        {/* AI Proactive Recommendation Carousel */}
        <div className="lg:w-96 p-6 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 text-white relative overflow-hidden flex flex-col justify-between shadow-xl shadow-brand-500/10">
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full filter blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded">
              AI Recommendation
            </span>
            <Sparkles className="h-4 w-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="space-y-2 min-h-[90px] transition-all duration-500 transform">
            <h4 className="font-bold text-sm text-amber-200">
              {recommendations[activeRecIndex].title}
            </h4>
            <p className="text-xs text-brand-100 leading-relaxed">
              {recommendations[activeRecIndex].text}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex space-x-1 mt-4">
            {recommendations.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveRecIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeRecIndex === i ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-950/30 rounded-xl text-brand-600 dark:text-brand-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Tasks</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{totalTasks}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Due Today</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{dueTodayTasks.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Overdue</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{overdueTasks.length}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${maxRisk >= 75 ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'}`}>
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Peak Risk</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1">{maxRisk}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Meters & Priority List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity & Procrastination Score Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between">
          <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-6">Productivity Profiler</h4>

          {/* Dual Circle Gauges */}
          <div className="flex flex-row justify-around items-center py-4">
            {/* Circle 1: Productivity Score */}
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <svg className="absolute transform -rotate-90 h-full w-full">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" className="text-gray-100 dark:text-dark-border" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" className="text-brand-500" strokeWidth="8" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - (analytics?.productivityScore || 80) / 100)} fill="transparent" strokeLinecap="round" />
                </svg>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {analytics?.productivityScore || 80}%
                </span>
              </div>
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                Focus Quality
              </span>
            </div>

            {/* Circle 2: Procrastination Risk */}
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <svg className="absolute transform -rotate-90 h-full w-full">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" className="text-gray-100 dark:text-dark-border" strokeWidth="6" fill="transparent" />
                  <circle cx="48" cy="48" r="40" stroke="currentColor" className={analytics?.procrastinationScore >= 50 ? 'text-red-500' : 'text-amber-500'} strokeWidth="8" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 * (1 - (analytics?.procrastinationScore || 0) / 100)} fill="transparent" strokeLinecap="round" />
                </svg>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {analytics?.procrastinationScore || 0}%
                </span>
              </div>
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
                Procrastination
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-dark-border flex justify-between items-center text-xs text-gray-500">
            <span>Completed Count: <b>{analytics?.completedTasksCount || 0}</b></span>
            <span>Focus Time: <b>{analytics?.focusTimeMinutes || 0}m</b></span>
          </div>
        </div>

        {/* Priority Queue (Sorted dynamically by priorityScore) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">Urgent AI Priority Queue</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Tasks dynamically sorted by the deadline and penalty engine.</p>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center space-x-0.5">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 dark:border-dark-border rounded-xl">
              <span className="text-3xl">🎉</span>
              <h5 className="font-bold text-sm text-gray-700 dark:text-gray-300 mt-2">Zero critical tasks</h5>
              <p className="text-xs text-gray-400 max-w-[240px] mt-0.5">
                All deadlines are safe. Go relax, or prepare ahead.
              </p>
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-gray-50 dark:divide-dark-border/30">
              {pendingTasks.slice(0, 4).map((task, i) => (
                <div key={task.id} className={`flex items-center justify-between pt-3 ${i === 0 ? 'pt-0' : ''}`}>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                        {task.title}
                      </h5>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        task.priority === 'urgent' || task.priority === 'high'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                          : 'bg-slate-50 text-slate-600 dark:bg-dark-input dark:text-gray-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-400">
                      <span>Due: <b>{new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></span>
                      <span>Difficulty: <b className="capitalize">{task.difficulty}</b></span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Priority score indicator badge */}
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 uppercase font-black block leading-none">Priority</span>
                      <span className={`text-md font-extrabold ${task.priorityScore >= 75 ? 'text-rose-500' : 'text-amber-500'}`}>
                        {task.priorityScore}
                      </span>
                    </div>
                    <Link
                      to={`/tasks?open=${task.id}`}
                      className="p-2 bg-gray-50 dark:bg-dark-input text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-all border border-gray-100 dark:border-dark-border"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
