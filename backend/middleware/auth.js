import { auth, isMockMode } from '../config/firebase.js';

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.DEV_MODE_BYPASS === 'true') {
      // Provide a mock user when bypass is active
      req.user = {
        uid: 'mock-user-123',
        email: 'mockuser@example.com',
        name: 'Mock User'
      };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    if (process.env.DEV_MODE_BYPASS === 'true') {
      req.user = {
        uid: token.startsWith('mock-uid-') ? token.replace('mock-uid-', '') : 'mock-user-123',
        email: 'mockuser@example.com',
        name: 'Mock User'
      };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
