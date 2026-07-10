import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Zap, 
  Loader2, 
  FileText, 
  Check, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export const AIPlanner = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Time window states
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('22:00');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [message, setMessage] = useState('');

  // Load existing schedules and tasks
  const loadPlannerData = async () => {
    try {
      setLoading(true);
      // Fetch tasks to display outstanding items
      const tasksData = await api.get('/api/tasks', token);
      setTasks(tasksData.filter(t => t.status !== 'completed'));

      // Fetch user's current schedule from backend database
      try {
        const dbSchedule = await api.get('/api/schedule', token);
        if (dbSchedule && dbSchedule.length > 0) {
          setSchedule(dbSchedule);
          localStorage.setItem('user_schedule', JSON.stringify(dbSchedule));
        } else {
          const cached = localStorage.getItem('user_schedule');
          if (cached) {
            setSchedule(JSON.parse(cached));
          }
        }
      } catch (err) {
        console.error('Error fetching schedule from backend, falling back to cache:', err);
        const cached = localStorage.getItem('user_schedule');
        if (cached) {
          setSchedule(JSON.parse(cached));
        }
      }
    } catch (error) {
      console.error('Error fetching planner data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPlannerData();
    }
  }, [token]);

  // Request AI Scheduler
  const handleGenerateSchedule = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    try {
      setLoading(true);
      setMessage('');

      // Form full ISO timestamps
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

      const response = await api.post('/api/ai/generate-schedule', {
        startTime: startDateTime,
        endTime: endDateTime
      }, token);

      // Save to state and cache
      setSchedule(response);
      localStorage.setItem('user_schedule', JSON.stringify(response));

      if (response.length === 0) {
        setMessage('No pending tasks to schedule! Enjoy your free time.');
      } else {
        setMessage('AI Smart Schedule generated successfully.');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      setMessage('Failed to generate schedule. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Mark schedule task complete
  const handleToggleEventComplete = async (eventId) => {
    const targetEvent = schedule.find(ev => ev.id === eventId);
    if (!targetEvent) return;

    const targetCompleted = !targetEvent.completed;

    const updated = schedule.map(ev => 
      ev.id === eventId ? { ...ev, completed: targetCompleted } : ev
    );
    setSchedule(updated);
    localStorage.setItem('user_schedule', JSON.stringify(updated));

    try {
      await api.put(`/api/schedule/${eventId}`, { completed: targetCompleted }, token);
    } catch (error) {
      console.error('Failed to sync schedule state to DB:', error);
    }
  };

  // Google Calendar Integration Mock link generator
  const getGoogleCalendarLink = (event) => {
    const startStr = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const details = `Last Minute Life Saver scheduled sprint for ${event.taskTitle}`;
    
    return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(event.taskTitle)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&sf=true`;
  };

  // ICS File Download helper
  const handleDownloadICS = () => {
    if (schedule.length === 0) return;

    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Last Minute Life Saver//EN\n";
    
    schedule.forEach(event => {
      const startStr = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endStr = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      icsContent += `BEGIN:VEVENT\nSUMMARY:${event.taskTitle}\nDTSTART:${startStr}\nDTEND:${endStr}\nDESCRIPTION:Task Scheduled by AI Productivity Companion\nEND:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'lifesaver-schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Title block */}
      <div className="p-6 rounded-2xl glass border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full filter blur-xl pointer-events-none" />
        <span className="text-[11px] font-black uppercase text-brand-600 dark:text-brand-400 tracking-wider flex items-center space-x-1">
          <Sparkles className="h-3 w-3 text-brand-500 fill-brand-500" />
          <span>Smart Scheduling Agent</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
          Allocate your focus blocks.
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1 max-w-lg">
          Specify your available hours. The AI will distribute tasks and schedules based on priority scores, creating breaks to avoid fatigue.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Availability Form Block */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white">Configure Availability</h4>

          <form onSubmit={handleGenerateSchedule} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Select Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Start Hour
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  End Hour
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || tasks.length === 0}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 glow-indigo"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calculating schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Focus Schedule</span>
                </>
              )}
            </button>
          </form>

          {tasks.length === 0 && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center space-x-2">
              <Check className="h-4 w-4" />
              <span>All tasks complete. Dynamic scheduling is disabled.</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30 text-brand-600 dark:text-brand-400 text-xs text-center font-medium">
              {message}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-dark-border">
            <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Pending Tasks Queue</h5>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No pending tasks.</div>
              ) : (
                tasks.slice(0, 3).map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-gray-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-input text-xs flex justify-between">
                    <span className="font-semibold truncate pr-2">{t.title}</span>
                    <span className="text-brand-500 font-bold shrink-0">{t.estimatedDuration}h</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Schedule Timeline Block */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-bold text-sm text-gray-800 dark:text-white">Active Timeline Slots</h4>
            
            {schedule.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadICS}
                  className="bg-gray-50 hover:bg-gray-100 dark:bg-dark-input dark:hover:bg-dark-border text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-dark-border text-xs font-semibold flex items-center space-x-1.5"
                  title="Download standard .ics file"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Download .ICS</span>
                </button>
              </div>
            )}
          </div>

          {schedule.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 border-2 border-dashed border-gray-100 dark:border-dark-border rounded-xl">
              <Calendar className="h-8 w-8 text-gray-300 mb-2 animate-bounce-slow" />
              <h5 className="font-bold text-xs text-gray-700 dark:text-gray-300">No active schedule</h5>
              <p className="text-xs text-gray-400 max-w-[280px] mt-0.5">
                Configure your available date & hours in the card, then generate today's timeline blocks.
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {schedule.map((item, idx) => {
                const isWork = item.type === 'work';
                const startTimeStr = new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={item.id || idx}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      item.completed 
                        ? 'bg-gray-50/50 dark:bg-dark-bg/20 border-gray-100 dark:border-dark-border opacity-50' 
                        : isWork
                          ? 'bg-brand-50/20 border-brand-100 dark:bg-brand-950/10 dark:border-brand-900/30'
                          : 'bg-emerald-50/20 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Checkoff circle */}
                      <button
                        onClick={() => handleToggleEventComplete(item.id || idx)}
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : isWork
                              ? 'border-brand-300 hover:border-brand-500 text-transparent'
                              : 'border-emerald-300 hover:border-emerald-500 text-transparent'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className={`text-xs font-bold text-gray-800 dark:text-gray-200 ${item.completed ? 'line-through text-gray-400' : ''}`}>
                            {item.taskTitle}
                          </h5>
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isWork 
                              ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400' 
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{startTimeStr} - {endTimeStr}</span>
                        </p>
                      </div>
                    </div>

                    {isWork && !item.completed && (
                      <a
                        href={getGoogleCalendarLink(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-white dark:hover:bg-dark-input rounded-lg border border-transparent hover:border-gray-100 dark:hover:border-dark-border transition-all flex items-center space-x-1"
                        title="Add to Google Calendar"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold">Sync</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default AIPlanner;
