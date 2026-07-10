import express from 'express';
import { db, auth } from '../config/firebase.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name, uid: clientUid } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and Name are required.' });
  }

  try {
    let uid = clientUid;
    let userRecord;

    if (!uid && password) {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name
      });
      uid = userRecord.uid;
    }

    if (!uid) {
      return res.status(400).json({
        error: 'UID is required if password is not provided.'
      });
    }

    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    const userData = {
      uid,
      name,
      email,
      productivityScore: 80,
      procrastinationScore: 0,
      completedTasksCount: 0,
      missedDeadlinesCount: 0,
      focusTimeMinutes: 0,
      createdAt: new Date().toISOString()
    };

    if (!userSnap.exists) {
      await userDocRef.set(userData);
    }

    res.status(201).json({
      message: 'User setup completed successfully.',
      user: { uid, name, email }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { uid, email, name } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and Email are required.' });
  }

  try {
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      const newProfile = {
        uid,
        name: name || email.split('@')[0],
        email,
        productivityScore: 80,
        procrastinationScore: 0,
        completedTasksCount: 0,
        missedDeadlinesCount: 0,
        focusTimeMinutes: 0,
        createdAt: new Date().toISOString()
      };

      await userDocRef.set(newProfile);
      return res.status(200).json({
        message: 'Profile synced.',
        user: newProfile
      });
    }

    res.status(200).json({
      message: 'Profile found.',
      user: userSnap.data()
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;