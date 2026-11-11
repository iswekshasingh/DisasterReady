import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './src/routes/health.routes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import scenarioRoutes from './src/routes/scenario.routes.js';
import attemptRoutes from './src/routes/attempt.routes.js';
import leaderboardRoutes from './src/routes/leaderboard.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ message: 'DisasterReady Backend is running!' });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DisasterReady Backend is running on http://localhost:${PORT}`);
  console.log(`📋 Health check available at: http://localhost:${PORT}/api/health`);
});

export default app;

