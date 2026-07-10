import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export const CalendarView = () => {
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const tasksData = await api.get('/api/tasks', token);
        setTasks(tasksData);

        // Fetch user schedule from database
        try {
          const dbSchedule = await api.get('/api/schedule', token);
          if (dbSchedule && dbSchedule.length > 0) {
            setSchedule(dbSchedule);
            localStorage.setItem('user_schedule', JSON.stringify(dbSchedule));
          } else {
            const cachedSchedule = localStorage.getItem('user_schedule');
            if (cachedSchedule) {
              setSchedule(JSON.parse(cachedSchedule));
            }
          }
        } catch (scheduleErr) {
          console.error('Error fetching calendar schedule from DB, falling back to cache:', scheduleErr);
          const cachedSchedule = localStorage.getItem('user_schedule');
          if (cachedSchedule) {
            setSchedule(JSON.parse(cachedSchedule));
          }
        }
      } catch (err) {
        console.error('Error loading calendar data:', err);
      }
    };

    loadData();
  }, [token]);

  // Calendar logic helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get tasks due on a specific day
  const getTasksForDate = (dayNum) => {
    return tasks.filter(task => {
      const d = new Date(task.deadline);
      return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  // Get schedule blocks on a specific day
  const getScheduleForDate = (dayNum) => {
    return schedule.filter(slot => {
      const d = new Date(slot.startTime);
      return d.getDate() === dayNum && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  // Render Calendar Cells
  const cells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      dateObject: new Date(year, month - 1, prevMonthTotalDays - i)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    cells.push({
      day: i,
      isCurrentMonth: true,
      dateObject: new Date(year, month, i)
    });
  }

  // Next month leading days
  const remainingCells = 42 - cells.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      dateObject: new Date(year, month + 1, i)
    });
  }

  const selectedDateTasks = tasks.filter(task => {
    const d = new Date(task.deadline);
    return d.toDateString() === selectedDate.toDateString();
  });

  const selectedDateSchedule = schedule.filter(slot => {
    const d = new Date(slot.startTime);
    return d.toDateString() === selectedDate.toDateString();
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Calendar Grid Box */}
        <div className="flex-1 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col">
          
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-brand-500" />
              <h3 className="font-extrabold text-md text-gray-800 dark:text-white">
                {monthNames[month]} {year}
              </h3>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-input rounded-xl border border-gray-100 dark:border-dark-border transition-colors text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-input rounded-xl border border-gray-100 dark:border-dark-border transition-colors text-gray-600 dark:text-gray-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekday Titles */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekdays.map(day => (
              <span key={day} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {cells.map((cell, idx) => {
              const cellTasks = cell.isCurrentMonth ? getTasksForDate(cell.day) : [];
              const cellSchedule = cell.isCurrentMonth ? getScheduleForDate(cell.day) : [];
              
              const isSelected = cell.dateObject.toDateString() === selectedDate.toDateString();
              const isToday = cell.dateObject.toDateString() === new Date().toDateString();

              const hasTasks = cellTasks.length > 0;
              const hasSchedules = cellSchedule.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => cell.isCurrentMonth && setSelectedDate(cell.dateObject)}
                  className={`min-h-[75px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'border-transparent text-gray-300 dark:text-gray-700 pointer-events-none'
                      : isSelected
                        ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                        : 'border-gray-50 dark:border-dark-border bg-slate-50/40 dark:bg-dark-input hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-bold ${
                      isToday
                        ? 'bg-brand-500 text-white h-5 w-5 rounded-full flex items-center justify-center'
                        : isSelected
                          ? 'text-brand-600 dark:text-brand-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {cell.day}
                    </span>
                  </div>

                  {/* Indicators for tasks or work sessions */}
                  <div className="flex flex-col gap-1 mt-1">
                    {hasTasks && (
                      <div className="flex items-center space-x-1 text-[8px] font-black uppercase text-rose-500 bg-rose-500/10 px-1 rounded truncate">
                        <span className="h-1 w-1 bg-rose-500 rounded-full shrink-0" />
                        <span className="truncate">{cellTasks.length} Deadline{cellTasks.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {hasSchedules && (
                      <div className="flex items-center space-x-1 text-[8px] font-black uppercase text-brand-500 bg-brand-500/10 px-1 rounded truncate">
                        <span className="h-1 w-1 bg-brand-500 rounded-full shrink-0" />
                        <span className="truncate">{cellSchedule.length} AI Block{cellSchedule.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Focus Details Panel */}
        <div className="w-full lg:w-80 p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Date Focus View</span>
            <h4 className="font-extrabold text-md text-brand-600 dark:text-brand-400 mt-1 pb-4 border-b border-gray-100 dark:border-dark-border">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h4>

            {/* List of actions for this date */}
            <div className="space-y-5 mt-6">
              
              {/* Deadlines Section */}
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-500 mb-2">Deadlines</h5>
                {selectedDateTasks.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No deadlines due on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateTasks.map(task => (
                      <div key={task.id} className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs">
                        <div className="font-bold text-gray-800 dark:text-gray-200">{task.title}</div>
                        <div className="text-[10px] text-gray-400 mt-1">Due: {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Schedules Block */}
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-500 mb-2">AI Work Blocks</h5>
                {selectedDateSchedule.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No AI work sessions scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDateSchedule.map((slot, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-brand-500/5 border border-brand-500/10 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-800 dark:text-gray-200">{slot.taskTitle}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <span className="text-[9px] uppercase bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 px-1.5 py-0.2 rounded font-black shrink-0">
                          {slot.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-dark-border text-center text-[10px] text-gray-400 flex items-center justify-center space-x-1">
            <Sparkles className="h-3 w-3 text-brand-500 fill-brand-500" />
            <span>Updates sync automatically with AI modules.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CalendarView;
