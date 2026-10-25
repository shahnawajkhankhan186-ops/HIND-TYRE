const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const apiRoutes = require('./routes/api');
const { errorHandler } = require('./middleware/errorHandler.middleware');

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible PDF/embed preview
    crossOriginEmbedderPolicy: false,
  })
);

// CORS
const allowedOrigins = [
  config.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev
    },
    credentials: true,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500, // Generous limit for high-volume POS & billing operations
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount API Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'HIND TYRES AND ACCESSORIES API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
