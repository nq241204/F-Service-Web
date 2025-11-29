// Security Middleware for Enhanced Protection
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security Headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.API_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5173',
      'https://your-production-domain.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Data Sanitization
const sanitizeData = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  
  // Remove MongoDB operators
  mongoSanitize()(req, res, () => {
    // Prevent HTTP Parameter Pollution
    hpp()(req, res, next);
  });
};

// Security Audit Logger
const securityLogger = (req, res, next) => {
  const securityEvents = [
    'auth/login',
    'auth/register',
    'auth/reset-password',
    'auth/forgot-password'
  ];
  
  if (securityEvents.some(path => req.path.includes(path))) {
    console.log(`🔒 Security Event: ${req.method} ${req.path} from ${req.ip}`);
    
    // Log failed authentication attempts
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        console.log(`🚨 Failed Auth Attempt: ${req.method} ${req.path} - Status: ${res.statusCode}`);
      }
    });
  }
  
  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  securityHeaders,
  corsOptions,
  sanitizeData,
  securityLogger
};
