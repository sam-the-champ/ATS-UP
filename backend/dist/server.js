"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./api/routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./api/routes/userRoutes"));
const jobRoutes_1 = __importDefault(require("./api/routes/jobRoutes"));
const applicationRoutes_1 = __importDefault(require("./api/routes/applicationRoutes"));
const healthcheck_1 = __importDefault(require("./api/routes/healthcheck"));
const RateLimiter_1 = require("./api/middlewares/RateLimiter");
const ScoringWorker_1 = require("./modules/applications/workers/ScoringWorker");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// Global rate limiting
app.use(RateLimiter_1.globalLimiter);
// Health check (before auth middleware)
app.use('/api/v1/health', healthcheck_1.default);
// API routes
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/api/v1/jobs', jobRoutes_1.default);
app.use('/api/v1/applications', applicationRoutes_1.default);
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
app.use((err, req, res, next) => {
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
ScoringWorker_1.scoringWorker.on('ready', () => {
    console.log('🤖 AI Scoring Worker is ready');
});
ScoringWorker_1.scoringWorker.on('error', (err) => {
    console.error('🤖 AI Scoring Worker error:', err);
});
exports.default = app;
