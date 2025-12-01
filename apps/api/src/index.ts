import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env FIRST, before any other imports
const envPath = resolve(__dirname, '../../.env');
console.log('[ENV] Loading .env from:', envPath);
config({ path: envPath });
console.log('[ENV] MODEL_NAME after loading:', process.env.MODEL_NAME);

// Debug: Verify GOOGLE_API_KEY is loaded (show first 10 chars only)
if (process.env.GOOGLE_API_KEY) {
  console.log('[ENV] GOOGLE_API_KEY loaded:', process.env.GOOGLE_API_KEY.substring(0, 10) + '...');
} else {
  console.error('[ENV] GOOGLE_API_KEY is NOT loaded!');
}

import express from 'express';
import cors from 'cors';
import { notesRouter } from './routers/notesRouter';
import { cacheRouter } from './routers/cacheRouter';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { initializeQueue } from './queue/queueManager';

const app = express();
const port = process.env.PORT || 4000;

// Middleware - Enhanced CORS for multiple ports
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.APP_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));

// CORS preflight logging
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Preflight request from origin:', req.get('origin'));
    console.log('[CORS] Requested headers:', req.get('access-control-request-headers'));
    console.log('[CORS] Requested method:', req.get('access-control-request-method'));
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path} from ${req.get('origin') || 'no-origin'}`);
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'notmat API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/notes', notesRouter);
app.use('/api/v1/cache', cacheRouter);

// Error handling
app.use(errorHandler);

// Validate required environment variables
function validateEnvironment() {
  const required = ['GOOGLE_API_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}. Get your free Google Gemini API key at: https://makersuite.google.com/app/apikey`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

// Initialize queue and start server
async function startServer() {
  try {
    // Validate environment first
    validateEnvironment();

    await initializeQueue();
    logger.info('Queue initialized successfully');

    app.listen(port, () => {
      logger.info(`API server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;
