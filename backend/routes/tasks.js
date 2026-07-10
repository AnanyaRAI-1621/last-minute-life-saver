import express from 'express';
import { db } from '../config/firebase.js';
import { authMiddleware } from '../middleware/auth.js';
import { analyzeTaskBreakdown } from '../services/aiService.js';
import { calculatePriorityScore, calculateDeadlineRisk } from '../services/priorityEngine.js';

const router = express.Router();

// Apply Auth Middleware to all task routes
router.use(authMiddleware);

// GET /api/tasks - Retrieve user's tasks with dynamically calculated priority scores and risk meters
router.get('/', async (req, res) => {
  const userId = req.user.uid;

  try {
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', userId)
      .get();

    const tasksList = [];
    const writePromises = [];

    tasksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const task = { id: doc.id, ...data };

      // Calculate dynamic priority score and deadline risk
      const oldPriorityScore = task.priorityScore;
      const oldDeadlineRisk = task.deadlineRisk;

      task.priorityScore = calculatePriorityScore(task);
      task.deadlineRisk = calculateDeadlineRisk(task);

      // Check if status is overdue
      const now = new Date();
      const deadline = new Date(task.deadline);
      if (task.status !== 'completed' && deadline < now) {
        task.status = 'overdue';
      }

      tasksList.push(task);

      // If scores updated, sync them back to DB asynchronously
      if (task.priorityScore !== oldPriorityScore || task.deadlineRisk !== oldDeadlineRisk || task.status !== data.status) {
        writePromises.push(
          db.collection('tasks').doc(doc.id).update({
            priorityScore: task.priorityScore,
            deadlineRisk: task.deadlineRisk,
            status: task.status
          })
        );
      }
    });

    if (writePromises.length > 0) {
      await Promise.all(writePromises);
    }

    // Sort: highest priority score first
    tasksList.sort((a, b) => b.priorityScore - a.priorityScore);

    res.status(200).json(tasksList);
  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks - Create new task and generate AI breakdown
router.post('/', async (req, res) => {
  const userId = req.user.uid;
  const { title, description, deadline, priority, difficulty, estimatedDuration, category } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ error: 'Title and Deadline are required.' });
  }

  try {
    // 1. Analyze and breakdown using Gemini
    console.log(`Analyzing task via AI: "${title}"...`);
    const aiAnalysis = await analyzeTaskBreakdown(
      title,
      description,
      deadline,
      difficulty || 'medium',
      estimatedDuration || 1
    );

    // 2. Compute dynamic priority
    const tempTask = {
      title,
      description,
      deadline,
      priority: priority || 'medium',
      difficulty: difficulty || 'medium',
      estimatedDuration: estimatedDuration || 1,
      procrastinationHistory: [],
      status: 'pending'
    };

    const priorityScore = calculatePriorityScore(tempTask);
    const deadlineRisk = calculateDeadlineRisk(tempTask);

    const taskData = {
      userId,
      title,
      description: description || '',
      deadline,
      priority: priority || 'medium',
      difficulty: difficulty || 'medium',
      estimatedDuration: estimatedDuration || 1,
      category: category || 'general',
      status: 'pending',
      priorityScore,
      deadlineRisk,
      subtasks: aiAnalysis.subtasks || [],
      aiPlan: aiAnalysis.stepByStepPlan || '',
      actionableNotification: aiAnalysis.actionableNotification || '',
      procrastinationHistory: [],
      createdAt: new Date().toISOString()
    };

    // 3. Save to database
    const docRef = db.collection('tasks').doc();
    await docRef.set(taskData);

    console.log(`Task created with ID: ${docRef.id}`);

    res.status(201).json({ id: docRef.id, ...taskData });
  } catch (error) {
    console.error('Error creating task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tasks/:id - Update task properties (e.g. mark subtask complete, mark task complete, log delay)
router.put('/:id', async (req, res) => {
  const userId = req.user.uid;
  const taskId = req.params.id;
  const updates = req.body;

  try {
    const taskDocRef = db.collection('tasks').doc(taskId);
    const taskSnap = await taskDocRef.get();

    if (!taskSnap.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = taskSnap.data();
    if (taskData.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this task.' });
    }

    // Merge changes
    const mergedTask = { ...taskData, ...updates, id: taskId };

    // Recalculate dynamic values
    mergedTask.priorityScore = calculatePriorityScore(mergedTask);
    mergedTask.deadlineRisk = calculateDeadlineRisk(mergedTask);

    // If status transitioned to completed, update user productivity metrics
    const originalStatus = taskData.status;
    const finalStatus = mergedTask.status;

    if (finalStatus === 'completed' && originalStatus !== 'completed') {
      // User finished a task! Boost productivity score
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const uData = userSnap.data();
        const completedCount = (uData.completedTasksCount || 0) + 1;
        const currentProdScore = uData.productivityScore || 80;
        
        // Boost productivity score (max 100) and track focus time
        const newScore = Math.min(100, currentProdScore + 4);
        const taskDurationMinutes = (parseFloat(mergedTask.estimatedDuration) || 1) * 60;
        const currentFocus = uData.focusTimeMinutes || 0;

        await userRef.update({
          completedTasksCount: completedCount,
          productivityScore: newScore,
          focusTimeMinutes: currentFocus + taskDurationMinutes
        });
      }
    } else if (finalStatus !== 'completed' && originalStatus === 'completed') {
      // Uncompleted a task
      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const uData = userSnap.data();
        const completedCount = Math.max(0, (uData.completedTasksCount || 0) - 1);
        const currentProdScore = uData.productivityScore || 80;
        const newScore = Math.max(0, currentProdScore - 4);
        const taskDurationMinutes = (parseFloat(mergedTask.estimatedDuration) || 1) * 60;
        const currentFocus = uData.focusTimeMinutes || 0;

        await userRef.update({
          completedTasksCount: completedCount,
          productivityScore: newScore,
          focusTimeMinutes: Math.max(0, currentFocus - taskDurationMinutes)
        });
      }
    }

    // Update database record
    await taskDocRef.update({
      ...updates,
      priorityScore: mergedTask.priorityScore,
      deadlineRisk: mergedTask.deadlineRisk
    });

    res.status(200).json(mergedTask);
  } catch (error) {
    console.error('Error updating task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  const userId = req.user.uid;
  const taskId = req.params.id;

  try {
    const taskDocRef = db.collection('tasks').doc(taskId);
    const taskSnap = await taskDocRef.get();

    if (!taskSnap.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (taskSnap.data().userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await taskDocRef.delete();

    // Also clean up any associated schedule blocks
    const scheduleSnap = await db.collection('schedules')
      .where('taskId', '==', taskId)
      .get();
    
    const deletePromises = scheduleSnap.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    res.status(200).json({ message: 'Task and schedules deleted successfully.' });
  } catch (error) {
    console.error('Error deleting task:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
