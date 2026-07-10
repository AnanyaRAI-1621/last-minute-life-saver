import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import AIPlanner from './pages/AIPlanner';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import Layout from './components/Layout';
import { useAuth } from './contexts/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const [focusTime, setFocusTime] = useState(60);
  const [breakTime, setBreakTime] = useState(15);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationLevel, setNotificationLevel] = useState('high');

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      {/* Welcome Block */}
      <div className="p-6 rounded-2xl glass border border-white/10 relative overflow-hidden">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Profile & Preferences</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
          Customize your AI scheduler thresholds, vocal prompts, and productivity credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md glow-indigo">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-extrabold text-md text-gray-800 dark:text-white">{user?.name || 'Active User'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 px-2.5 py-1 rounded-full">
            Pro AI Planner Tier
          </span>
          <div className="w-full pt-4 border-t border-gray-100 dark:border-dark-border text-left space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">Mock Auth Bypass</span>
            </div>
            <div className="flex justify-between">
              <span>Member Since:</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Configurations Card */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm space-y-6">
          <h3 className="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wider pb-2 border-b border-gray-50 dark:border-dark-border/40">AI Engine Parameters</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Focus Block Duration</label>
                <span className="text-xs font-black text-brand-500">{focusTime} mins</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={focusTime}
                onChange={(e) => setFocusTime(e.target.value)}
                className="w-full h-2 bg-slate-100 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rest Interval Duration</label>
                <span className="text-xs font-black text-brand-500">{breakTime} mins</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={breakTime}
                onChange={(e) => setBreakTime(e.target.value)}
                className="w-full h-2 bg-slate-100 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200">Voice Assistant Speech Synthesis</h5>
                <p className="text-[10px] text-gray-400">Allows vocal notifications for active time blocks</p>
              </div>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${voiceEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-dark-border'}`}
              >
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${voiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="pt-2 flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deadline Alert Risk Threshold</label>
              <select
                value={notificationLevel}
                onChange={(e) => setNotificationLevel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-xs px-4 py-2.5 rounded-xl text-gray-800 dark:text-gray-200"
              >
                <option value="critical">{"Critical Only (Risk >= 85%)"}</option>
                <option value="high">{"High & Critical (Risk >= 60%)"}</option>
                <option value="medium">{"All Warnings (Risk >= 40%)"}</option>
              </select>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-dark-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold">Initializing Security Protocols...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" replace />}
        />

        {/* Private Routes wrapped in Layout */}
        <Route
          path="/"
          element={
            user ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/tasks"
          element={
            user ? (
              <Layout>
                <Tasks />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/planner"
          element={
            user ? (
              <Layout>
                <AIPlanner />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendar"
          element={
            user ? (
              <Layout>
                <CalendarView />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            user ? (
              <Layout>
                <Analytics />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            user ? (
              <Layout>
                <SettingsPage />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;