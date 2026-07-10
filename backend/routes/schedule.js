import express from 'express';
import { db } from '../config/firebase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All schedule routes require auth
router.use(authMiddleware);

// GET /api/schedule - Fetch active focus blocks for user
router.get('/', async (req, res) => {
  const userId = req.user.uid;

  try {
    const schedulesSnapshot = await db.collection('schedules')
      .where('userId', '==', userId)
      .get();

    const schedulesList = [];
    schedulesSnapshot.docs.forEach(doc => {
      schedulesList.push({ id: doc.id, ...doc.data() });
    });

    // Sort by startTime ascending
    schedulesList.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    res.status(200).json(schedulesList);
  } catch (error) {
    console.error('Error fetching schedules:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/schedule/:id - Update schedule event properties (e.g. mark completed)
router.put('/:id', async (req, res) => {
  const userId = req.user.uid;
  const scheduleId = req.params.id;
  const { completed } = req.body;

  try {
    const docRef = db.collection('schedules').doc(scheduleId);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: 'Schedule slot not found.' });
    }

    const data = snap.data();
    if (data.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this schedule.' });
    }

    await docRef.update({ completed });

    res.status(200).json({ id: scheduleId, ...data, completed });
  } catch (error) {
    console.error('Error updating schedule slot:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/schedule - Delete all schedule blocks for this user
router.delete('/', async (req, res) => {
  const userId = req.user.uid;

  try {
    const snapshot = await db.collection('schedules')
      .where('userId', '==', userId)
      .get();

    const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    res.status(200).json({ message: 'Schedules cleared successfully.' });
  } catch (error) {
    console.error('Error clearing schedules:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
