import express from "express";
import { db } from "../config/firebase.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  generateRescuePlan,
  generateVoiceAssistantResponse
} from "../services/aiService.js";

const router = express.Router();

// All AI endpoints require authentication
router.use(authMiddleware);

// POST /api/ai/generate-schedule - Computes focus schedule and saves it to Firestore
router.post("/generate-schedule", async (req, res) => {
  const userId = req.user.uid;
  const { startTime, endTime } = req.body;

  if (!startTime || !endTime) {
    return res.status(400).json({ error: "startTime and endTime are required." });
  }

  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: "Invalid start or end time format." });
    }

    // 1. Fetch pending/overdue tasks for user
    const tasksSnapshot = await db.collection("tasks")
      .where("userId", "==", userId)
      .get();

    const pendingTasks = [];
    tasksSnapshot.docs.forEach(doc => {
      const task = doc.data();
      if (task.status !== "completed") {
        pendingTasks.push({ id: doc.id, ...task });
      }
    });

    // Sort by priorityScore descending
    pendingTasks.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // 2. Clear old user schedules
    const oldSchedulesSnapshot = await db.collection("schedules")
      .where("userId", "==", userId)
      .get();

    const deletePromises = oldSchedulesSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // 3. Generate sequential focus schedule slots
    const scheduleEvents = [];
    let currentTime = new Date(start);

    // Focus block length is 60 minutes, break block length is 15 minutes.
    const FOCUS_MS = 60 * 60 * 1000;
    const BREAK_MS = 15 * 60 * 1000;

    for (const task of pendingTasks) {
      if (currentTime >= end) break;

      // Calculate task work duration in hours
      const estHours = parseFloat(task.estimatedDuration) || 1;
      let remainingTaskMs = estHours * 60 * 60 * 1000;

      // Schedule focus blocks for this task
      while (remainingTaskMs > 0 && currentTime < end) {
        // Calculate block duration (min of remaining task time, default focus block, remaining slot time)
        const availableMs = end.getTime() - currentTime.getTime();
        const blockDuration = Math.min(FOCUS_MS, remainingTaskMs, availableMs);

        if (blockDuration <= 0) break;

        const blockEnd = new Date(currentTime.getTime() + blockDuration);

        const newBlock = {
          userId,
          taskId: task.id,
          taskTitle: task.title,
          type: "work",
          startTime: currentTime.toISOString(),
          endTime: blockEnd.toISOString(),
          completed: false,
          createdAt: new Date().toISOString()
        };

        // Save block to DB
        const docRef = db.collection("schedules").doc();
        await docRef.set(newBlock);
        scheduleEvents.push({ id: docRef.id, ...newBlock });

        currentTime = blockEnd;
        remainingTaskMs -= blockDuration;

        // If time remains, schedule a short break block
        const timeRemaining = end.getTime() - currentTime.getTime();
        if (timeRemaining > 0 && remainingTaskMs > 0) {
          const breakDuration = Math.min(BREAK_MS, timeRemaining);
          const breakEnd = new Date(currentTime.getTime() + breakDuration);

          const breakBlock = {
            userId,
            taskId: null,
            taskTitle: "Short Break",
            type: "break",
            startTime: currentTime.toISOString(),
            endTime: breakEnd.toISOString(),
            completed: false,
            createdAt: new Date().toISOString()
          };

          const breakRef = db.collection("schedules").doc();
          await breakRef.set(breakBlock);
          scheduleEvents.push({ id: breakRef.id, ...breakBlock });

          currentTime = breakEnd;
        }
      }
    }

    res.status(200).json(scheduleEvents);
  } catch (error) {
    console.error("Error generating focus schedule:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/rescue-plan - Calculates compressed emergency rescue steps for close deadlines
router.post("/rescue-plan", async (req, res) => {
  const userId = req.user.uid;
  const { taskId } = req.body;

  if (!taskId) {
    return res.status(400).json({ error: "taskId is required." });
  }

  try {
    const taskDoc = await db.collection("tasks").doc(taskId).get();

    if (!taskDoc.exists) {
      return res.status(404).json({ error: "Task not found." });
    }

    const task = taskDoc.data();
    if (task.userId !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not own this task." });
    }

    const procrastinationHistoryCount = Array.isArray(task.procrastinationHistory)
      ? task.procrastinationHistory.length
      : 0;

    // Generate condensed rescue plan
    const rescuePlan = await generateRescuePlan(task, procrastinationHistoryCount);

    res.status(200).json(rescuePlan);
  } catch (error) {
    console.error("Error generating emergency rescue plan:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/voice-assistant - Processes user query in context of their active tasks
router.post("/voice-assistant", async (req, res) => {
  const userId = req.user.uid;
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  try {
    // Fetch user's pending tasks for Gemini context
    const tasksSnapshot = await db.collection("tasks")
      .where("userId", "==", userId)
      .get();

    const pendingTasks = [];
    tasksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status !== "completed") {
        pendingTasks.push({
          id: doc.id,
          title: data.title,
          priority: data.priority,
          priorityScore: data.priorityScore,
          deadlineRisk: data.deadlineRisk,
          deadline: data.deadline
        });
      }
    });

    const assistantResponse = await generateVoiceAssistantResponse(query, pendingTasks);

    res.status(200).json(assistantResponse);
  } catch (error) {
    console.error("Error processing voice assistant request:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;