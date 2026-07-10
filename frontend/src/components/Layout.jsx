import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Flame 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { VoiceAssistant } from './VoiceAssistant';
import { api } from '../utils/api';

export const Layout = ({ children }) => {
  const { user, logout, token } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [criticalTasks, setCriticalTasks] = useState([]);

  // Check for critical risk tasks periodically
  useEffect(() => {
    if (!token) return;

    const checkCriticalTasks = async () => {
      try {
        const tasks = await api.get('/api/tasks', token);
        const critical = tasks.filter(t => t.status !== 'completed' && t.deadlineRisk >= 80);
        setCriticalTasks(critical);
      } catch (error) {
        console.error('Error checking critical tasks:', error);
      }
    };

    checkCriticalTasks();
    const interval = setInterval(checkCriticalTasks, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [token, location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Task Manager', path: '/tasks', icon: CheckSquare },
    { name: 'AI Planner', path: '/planner', icon: Sparkles },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border hidden md:flex flex-col z-20">
        {/* Logo / Header */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-dark-border space-x-2">
          <div className="p-1.5 bg-rose-500 rounded-lg text-white">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
          <span className="font-extrabold text-md tracking-tight bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
            Life Saver AI
          </span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-black bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            PRO
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm glow-indigo'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-input hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/20">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                {user?.name || 'Active User'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors border border-dashed border-rose-200 dark:border-rose-900/40"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border flex items-center justify-between px-6 z-10">
          <h1 className="text-lg font-bold text-gray-800 dark:text-white md:block hidden">
            {navItems.find(item => item.path === location.pathname)?.name || 'Life Saver Portal'}
          </h1>
          <div className="md:hidden flex items-center space-x-2">
            <div className="p-1 bg-rose-500 rounded text-white">
              <Flame className="h-4.5 w-4.5" />
            </div>
            <span className="font-extrabold text-sm text-gray-800 dark:text-white">Life Saver AI</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-input text-gray-600 dark:text-gray-400 transition-colors"
              title="Toggle theme mode"
            >
              {isDark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-700" />}
            </button>

            {/* Mobile LogOut Link */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Emergency Alert Banner (Proactive Notification) */}
        {criticalTasks.length > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-6 py-2.5 flex items-center justify-between shadow-md animate-pulse">
            <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-white animate-bounce-slow" />
              <span>
                CRITICAL WARNING: "{criticalTasks[0].title}" has a {criticalTasks[0].deadlineRisk}% risk of missing the deadline!
              </span>
            </div>
            <Link
              to="/tasks"
              className="text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-white text-rose-700 px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Launch Rescue Mode
            </Link>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Floating Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
};
export default Layout;
