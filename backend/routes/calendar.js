import express from 'express';
import { db } from '../config/firebase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// GET /api/calendar - Fetches aggregated schedule and task deadlines for calendar presentation
router.get('/', async (req, res) => {
  const userId = req.user.uid;

  try {
    // 1. Fetch tasks
    const tasksSnapshot = await db.collection('tasks')
      .where('userId', '==', userId)
      .get();
    
    const taskEvents = [];
    tasksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      taskEvents.push({
        id: doc.id,
        title: `Deadline: ${data.title}`,
        start: data.deadline,
        end: data.deadline,
        type: 'deadline',
        priority: data.priority,
        priorityScore: data.priorityScore,
        deadlineRisk: data.deadlineRisk,
        status: data.status,
        category: data.category
      });
    });

    // 2. Fetch schedules
    const schedulesSnapshot = await db.collection('schedules')
      .where('userId', '==', userId)
      .get();

    const scheduleEvents = [];
    schedulesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      scheduleEvents.push({
        id: doc.id,
        title: data.taskTitle,
        start: data.startTime,
        end: data.endTime,
        type: data.type, // 'work' or 'break'
        completed: data.completed,
        taskId: data.taskId
      });
    });

    res.status(200).json({
      deadlines: taskEvents,
      schedules: scheduleEvents,
      allEvents: [...taskEvents, ...scheduleEvents]
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
