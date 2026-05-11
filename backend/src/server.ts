import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './api/routes/authRoutes';
import userRoutes from './api/routes/userRoutes';
import jobRoutes from './api/routes/jobRoutes';
import applicationRoutes from './api/routes/applicationRoutes';
import healthcheckRoutes from './api/routes/healthcheck';
import { globalLimiter } from './api/middlewares/RateLimiter';
import { scoringWorker } from './modules/applications/workers/ScoringWorker';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Global rate limiting
app.use(globalLimiter);

// Health check (before auth middleware)
app.use('/api/v1/health', healthcheckRoutes);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/applications', applicationRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "ATS-UP API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      users: "/api/v1/users",
      jobs: "/api/v1/jobs",
      applications: "/api/v1/applications",
      health: "/api/v1/health"
    },
    docs: "See README.md for API documentation"
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 ATS-UP API server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/v1/health`);
  console.log(`📚 API documentation in README.md`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Start background workers
scoringWorker.on('ready', () => {
  console.log('🤖 AI Scoring Worker is ready');
});

scoringWorker.on('error', (err) => {
  console.error('🤖 AI Scoring Worker error:', err);
});

export default app;