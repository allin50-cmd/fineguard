const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const pino = require('pino');
const { createClient } = require('redis');
require('dotenv').config();

// Import routes
const authRoutes = require('./api/auth');
const companiesRoutes = require('./api/companies');
const alertsRoutes = require('./api/alerts');
const dashboardRoutes = require('./api/dashboard');
const billingRoutes = require('./api/billing');
const acspRoutes = require('./api/acsp');
const internalRoutes = require('./api/internal');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const performanceMonitor = require('./middleware/performanceMonitor');

// Import utilities
const db = require('./db/pool');
const cache = require('./config/cache');
const monitor = require('./monitoring/metrics');

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  }
});

// Initialize Express
const app = express();
const PORT = process.env.PORT || 8080;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// ============================================================
// RATE LIMITING & THROTTLING
// ============================================================

// Global rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please slow down and try again later'
    });
  }
});

// Speed limiter (gradually slow down responses)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: 500
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.'
});

// ============================================================
// GENERAL MIDDLEWARE
// ============================================================

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Custom request logger
app.use(requestLogger(logger));

// Performance monitoring
app.use(performanceMonitor(logger));

// ============================================================
// HEALTH CHECKS & MONITORING
// ============================================================

// Liveness probe
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Readiness probe
app.get('/ready', async (req, res) => {
  try {
    // Check database
    await db.query('SELECT 1');
    
    // Check Redis
    const redisHealthy = await cache.ping();
    
    if (redisHealthy) {
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        cache: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Redis not connected');
    }
  } catch (error) {
    logger.error({ error }, 'Readiness check failed');
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Metrics endpoint (for Prometheus/monitoring)
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await monitor.getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error({ error }, 'Failed to get metrics');
    res.status(500).send('Error generating metrics');
  }
});

// System info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: 'FineGuard Enterprise API',
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    node: process.version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/acsp', acspRoutes);
app.use('/api/internal', internalRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FineGuard Enterprise API',
    version: '2.0.0',
    documentation: '/api/docs',
    health: '/health',
    ready: '/ready',
    metrics: '/metrics'
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Global error handler
app.use(errorHandler(logger));

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

let server;

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await db.end();
      logger.info('Database connections closed');
      
      // Close Redis connections
      await cache.quit();
      logger.info('Redis connections closed');
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('Database connected successfully');
    
    // Test Redis connection
    await cache.ping();
    logger.info('Redis connected successfully');
    
    // Start server
    server = app.listen(PORT, '0.0.0.0', () => {
      logger.info({
        port: PORT,
        environment: process.env.NODE_ENV,
        node: process.version
      }, 'FineGuard Enterprise API started successfully');
    });
    
    // Set keep-alive timeout
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
    
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
