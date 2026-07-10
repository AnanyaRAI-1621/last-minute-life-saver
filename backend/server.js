import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Import Routes
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import scheduleRoutes from './routes/schedule.js';
import calendarRoutes from './routes/calendar.js';

const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors({
  origin: '*', // For local testing. You can restrict this to the frontend URL in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/calendar', calendarRoutes);

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    appName: 'Last Minute Life Saver Backend API',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    bypassActive: process.env.DEV_MODE_BYPASS === 'true'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Last Minute Life Saver Backend running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Firebase bypass mode: ${process.env.DEV_MODE_BYPASS === 'true' ? 'ACTIVE' : 'INACTIVE'}`);
});
