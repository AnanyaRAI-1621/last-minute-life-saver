import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  Loader2, 
  PlusCircle, 
  TrendingUp,
  X,
  Zap,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

export const Tasks = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const focusTaskId = searchParams.get('open');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [creating, setCreating] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(1);
  const [category, setCategory] = useState('work');

  // AI Feature States
  const [rescuePlan, setRescuePlan] = useState(null);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [procrastinationAlert, setProcrastinationAlert] = useState(null);

  // Load Tasks
  const fetchTasks = async (autoOpenId) => {
    try {
      setLoading(true);
      const data = await api.get('/api/tasks', token);
      setTasks(data);
      
      const targetId = autoOpenId || focusTaskId;
      if (targetId) {
        const found = data.find(t => t.id === targetId);
        if (found) setSelectedTask(found);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, focusTaskId]);

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || !deadline) return;

    try {
      setCreating(true);
      const newTask = {
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        priority,
        difficulty,
        estimatedDuration: parseFloat(duration),
        category
      };

      const created = await api.post('/api/tasks', newTask, token);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDeadline('');
      setPriority('medium');
      setDifficulty('medium');
      setDuration(1);
      setCategory('work');

      // Refresh and select
      await fetchTasks(created.id);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to register task. Ensure backend is running.');
    } finally {
      setCreating(false);
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (subtaskId) => {
    if (!selectedTask) return;

    const updatedSubtasks = selectedTask.subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    try {
      const updated = await api.put(`/api/tasks/${selectedTask.id}`, {
        subtasks: updatedSubtasks
      }, token);

      setSelectedTask(updated);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  // Mark task completed/pending
  const handleToggleTaskStatus = async (task, targetStatus) => {
    try {
      const updated = await api.put(`/api/tasks/${task.id}`, {
        status: targetStatus
      }, token);

      if (selectedTask?.id === task.id) {
        setSelectedTask(updated);
      }
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`, token);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setRescuePlan(null);
        setProcrastinationAlert(null);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Simulate Procrastination (Mock skip slot)
  const handleSimulateProcrastination = async () => {
    if (!selectedTask) return;

    const newHistory = [...(selectedTask.procrastinationHistory || []), {
      skippedAt: new Date().toISOString()
    }];

    try {
      const updated = await api.put(`/api/tasks/${selectedTask.id}`, {
        procrastinationHistory: newHistory
      }, token);

      setSelectedTask(updated);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

      // Show proactive intervention warning
      const count = newHistory.length;
      const currentRisk = updated.deadlineRisk;
      const responsePrompt = `You skipped ${count} scheduled work sessions for this task. At current pace, there is a ${currentRisk}% chance you will miss this deadline. We recommend starting a 15-minute sprint immediately!`;
      setProcrastinationAlert(responsePrompt);
    } catch (error) {
      console.error('Error simulating procrastination:', error);
    }
  };

  // Launch Emergency Rescue Mode (Generate condensed plan)
  const handleTriggerRescue = async () => {
    if (!selectedTask) return;
    try {
      setRescueLoading(true);
      setRescuePlan(null);
      const data = await api.post('/api/ai/rescue-plan', { taskId: selectedTask.id }, token);
      setRescuePlan(data);
    } catch (error) {
      console.error('Error triggering emergency rescue plan:', error);
    } finally {
      setRescueLoading(false);
    }
  };

  // Task lists
  const pendingTasksList = tasks.filter(t => t.status !== 'completed');
  const completedTasksList = tasks.filter(t => t.status === 'completed');

  return (
    <div className="flex flex-col xl:flex-row gap-6 font-sans">
      
      {/* Left Pane: Creation & Lists */}
      <div className="flex-1 space-y-6">
        
        {/* Task Creation Form */}
        <div className="p-6 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-sm">
          <h3 className="font-extrabold text-md text-gray-800 dark:text-white flex items-center space-x-2">
            <PlusCircle className="h-5 w-5 text-brand-500" />
            <span>Create New Task</span>
          </h3>

          <form onSubmit={handleCreateTask} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Task Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Complete DSA Assignment, Pay Rent..."
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional notes or specifications..."
                rows="2"
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Deadline Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
              >
                <option value="work">Work Project</option>
                <option value="study">Study / Academic</option>
                <option value="personal">Personal / Life</option>
                <option value="bills">Finance / Bills</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm px-4 py-2.5 rounded-xl"
              >
                <option value="easy">Easy (Quick execution)</option>
                <option value="medium">Medium (Standard focus)</option>
                <option value="hard">Hard (Requires deep sprint)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Est. Duration (hours)
                </label>
                <span className="text-xs font-black text-brand-500">{duration}h</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50 shadow-sm shadow-brand-500/20"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI analyzing and breaking down...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Create & Analyze Task with Gemini</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tasks Queue Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-extrabold text-sm text-gray-700 dark:text-gray-300">
              Active Tasks Queue ({pendingTasksList.length})
            </h4>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400 text-xs font-semibold">Updating queues...</div>
          ) : pendingTasksList.length === 0 ? (
            <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-8 rounded-2xl text-center text-gray-400 text-xs">
              No active tasks found. Go create one!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasksList.map(task => (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setRescuePlan(null);
                    setProcrastinationAlert(null);
                  }}
                  className={`p-4 rounded-2xl bg-white dark:bg-dark-card border transition-all cursor-pointer flex items-center justify-between ${
                    selectedTask?.id === task.id
                      ? 'border-brand-500 ring-1 ring-brand-500/30 shadow-md'
                      : 'border-gray-100 dark:border-dark-border hover:border-gray-200 dark:hover:border-dark-border shadow-sm'
                  }`}
                >
                  <div className="flex items-center space-x-4 min-w-0 pr-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleTaskStatus(task, 'completed');
                      }}
                      className="p-1 rounded-full text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                      title="Mark task completed"
                    >
                      <CheckCircle className="h-6 w-6 stroke-1" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">
                          {task.title}
                        </h4>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          task.priority === 'urgent' || task.priority === 'high'
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                            : 'bg-slate-50 text-slate-600 dark:bg-dark-input dark:text-gray-400'
                        }`}>
                          {task.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">Risk</span>
                      <span className={`text-xs font-extrabold ${
                        task.deadlineRisk >= 80 ? 'text-red-500 animate-pulse' : task.deadlineRisk >= 50 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {task.deadlineRisk}%
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed list */}
        {completedTasksList.length > 0 && (
          <div className="space-y-3 opacity-60">
            <h4 className="font-extrabold text-sm text-gray-400 uppercase tracking-wider">Completed Tasks</h4>
            <div className="space-y-2">
              {completedTasksList.map(task => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-gray-100/50 dark:bg-dark-input border border-gray-200 dark:border-dark-border flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4 min-w-0 pr-4">
                    <button
                      onClick={() => handleToggleTaskStatus(task, 'pending')}
                      className="p-1 rounded-full text-emerald-500 transition-colors"
                    >
                      <CheckCircle className="h-6 w-6 fill-current" />
                    </button>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 line-through truncate">
                      {task.title}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Pane: AI Details Panel */}
      <div className="w-full xl:w-96">
        {selectedTask ? (
          <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm space-y-6 sticky top-6">
            
            {/* Header Title */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-dark-border">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-500">AI Task Agent</span>
                <h4 className="font-extrabold text-md text-gray-800 dark:text-white mt-1 leading-snug">
                  {selectedTask.title}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-input rounded-lg"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Risk & Priority Dashboard Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-dark-input rounded-xl text-center">
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400">Priority Score</span>
                <span className={`block text-xl font-black mt-1 ${selectedTask.priorityScore >= 75 ? 'text-rose-500' : 'text-amber-500'}`}>
                  {selectedTask.priorityScore}/100
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-dark-input rounded-xl text-center">
                <span className="text-[9px] uppercase font-extrabold tracking-wider text-gray-400">Deadline Risk</span>
                <span className={`block text-xl font-black mt-1 ${selectedTask.deadlineRisk >= 80 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {selectedTask.deadlineRisk}%
                </span>
              </div>
            </div>

            {/* Proactive Intervention Simulator */}
            <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center">
                  <Activity className="h-3 w-3 text-brand-500 mr-1" />
                  <span>Procrastination Logger</span>
                </span>
                <span className="text-xs font-bold text-rose-500">
                  {selectedTask.procrastinationHistory?.length || 0} Skips
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-normal">
                If the user delays scheduled slots, the engine increases priority rating and warns risk.
              </p>
              <button
                onClick={handleSimulateProcrastination}
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs py-2 rounded-xl transition-all"
              >
                Simulate Ignore / Skip Session
              </button>

              {procrastinationAlert && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-[11px] leading-relaxed text-rose-600 dark:text-rose-400 font-medium">
                  🤖 {procrastinationAlert}
                </div>
              )}
            </div>

            {/* AI Action Steps Plan */}
            {selectedTask.aiPlan && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500 mr-1" />
                  <span>AI Actionable Plan</span>
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-brand-50/30 dark:bg-brand-950/10 p-3 rounded-xl border border-brand-100/30">
                  {selectedTask.aiPlan}
                </p>
              </div>
            )}

            {/* Subtasks Checklists */}
            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tactical Subtasks Breakdown</h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTask.subtasks.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => handleToggleSubtask(sub.id)}
                      className="flex items-center space-x-3 p-2.5 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-input cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded text-brand-500 accent-brand-500 cursor-pointer h-4 w-4"
                      />
                      <span className={`text-xs flex-1 ${sub.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {sub.title}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-dark-bg px-1.5 py-0.5 rounded">
                        {sub.duration}m
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Rescue Mode */}
            <div className="pt-4 border-t border-gray-100 dark:border-dark-border space-y-3">
              <h5 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center">
                <ShieldAlert className="h-4 w-4 mr-1 animate-pulse" />
                <span>Emergency Rescue Mode</span>
              </h5>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Is time running out? Let the Rescue agent create an extreme focus sprint plan, omitting non-essentials.
              </p>
              <button
                onClick={handleTriggerRescue}
                disabled={rescueLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 glow-red"
              >
                {rescueLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing mandatory items...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Generate Rescue Crash Plan</span>
                  </>
                )}
              </button>

              {rescuePlan && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 space-y-3 mt-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-red-700 dark:text-red-400 font-extrabold uppercase">
                    <span>Rescue Plan Ready</span>
                    <span className="bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded">
                      Chance: {rescuePlan.estimatedCompletionChance}%
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-bold italic leading-relaxed">
                    "{rescuePlan.warningMessage}"
                  </p>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Must Do Steps:</span>
                    <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300 pl-4 list-disc">
                      {rescuePlan.emergencySteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-red-200/40">
                    <span className="text-[10px] font-black uppercase text-gray-400 block tracking-wider">Skip / Ignore items:</span>
                    <div className="flex flex-wrap gap-1">
                      {rescuePlan.skipItems.map((skip, idx) => (
                        <span key={idx} className="text-[9px] bg-gray-200 dark:bg-dark-border text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">
                          {skip}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="hidden xl:flex h-[60vh] border-2 border-dashed border-gray-200 dark:border-dark-border rounded-2xl items-center justify-center text-center p-6 text-gray-400 text-xs">
            <div>
              <Sparkles className="h-8 w-8 text-brand-400 mx-auto mb-2 animate-bounce-slow" />
              <span>Select an active task from queue to explore AI planning breakdowns, trigger rescue runs, or log delays.</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
export default Tasks;
