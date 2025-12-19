// Enhanced Security Middleware
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const { body, validationResult } = require('express-validator');

// Account Lockout System
const failedAttempts = new Map(); // In production, use Redis or database

const accountLockout = (req, res, next) => {
  const clientIp = req.ip;
  const now = Date.now();
  const lockoutDuration = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  const userAttempts = failedAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
  
  // Check if user is locked out
  if (userAttempts.lockUntil > now) {
    const remainingTime = Math.ceil((userAttempts.lockUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `Account temporarily locked. Try again in ${remainingTime} seconds.`,
      locked: true,
      remainingTime
    });
  }
  
  // Reset if lockout period has passed
  if (userAttempts.lockUntil > 0 && userAttempts.lockUntil <= now) {
    failedAttempts.set(clientIp, { count: 0, lockUntil: 0 });
  }
  
  // Store original res.json to intercept responses
  const originalJson = res.json;
  res.json = function(data) {
    // Track failed login attempts
    if (req.path.includes('/auth/login') && res.statusCode >= 400) {
      userAttempts.count++;
      
      // Lock account after max attempts
      if (userAttempts.count >= maxAttempts) {
        userAttempts.lockUntil = now + lockoutDuration;
        failedAttempts.set(clientIp, userAttempts);
        
        return originalJson.call(this, {
          success: false,
          message: `Too many failed attempts. Account locked for ${lockoutDuration / 60000} minutes.`,
          locked: true,
          attempts: userAttempts.count
        });
      }
      
      failedAttempts.set(clientIp, userAttempts);
    }
    
    // Reset counter on successful login
    if (req.path.includes('/auth/login') && res.statusCode < 400) {
      failedAttempts.set(clientIp, { count: 0, lockUntil: 0 });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Enhanced Rate Limiting (Updated for v7 compatibility with IPv6 support)
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
      retryAfter: Math.ceil((options.windowMs || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip || ((req) => false)
  });
};

// Specific rate limiters for different endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: 'Too many password reset attempts, please try again later.'
});

// Enhanced Security Headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.API_URL || "http://localhost:5001"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: process.env.NODE_ENV === 'production',
    preload: process.env.NODE_ENV === 'production'
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  permittedCrossDomainPolicies: false,
  ieNoOpen: true,
  dnsPrefetchControl: true
});

// Input Validation Middleware
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log validation errors
      console.warn(`🚨 Validation Error: ${req.method} ${req.path}`, {
        errors: errors.array(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  };
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  password: body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must be 2-50 characters long and contain only letters'),
  
  phone: body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format')
};

// Security Event Logger
const securityLogger = (req, res, next) => {
  const securityEvents = [
    'auth/login',
    'auth/register',
    'auth/reset-password',
    'auth/forgot-password',
    'admin/approve-member',
    'admin/users'
  ];
  
  const isSecurityEvent = securityEvents.some(path => req.path.includes(path));
  
  if (isSecurityEvent) {
    const startTime = Date.now();
    
    // Log incoming request
    console.log(`🔒 Security Event: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logLevel = res.statusCode >= 400 ? '🚨' : '✅';
      
      console.log(`${logLevel} Security Event Response: ${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
      
      // Alert on suspicious activity
      if (res.statusCode >= 400 && req.path.includes('auth')) {
        console.warn(`⚠️ Suspicious activity detected: ${req.ip} - ${req.path} - ${res.statusCode}`);
      }
    });
  }
  
  next();
};

// Request Size Limiter
const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
      maxSize: `${maxSize / 1024 / 1024}MB`
    });
  }
  
  next();
};

// IP Whitelist/Blacklist
const ipFilter = (req, res, next) => {
  const clientIp = req.ip;
  
  // Blacklisted IPs (in production, load from database/config)
  const blacklistedIPs = []; // Add malicious IPs here
  
  // Whitelisted IPs (for admin access)
  const whitelistedIPs = ['127.0.0.1', '::1']; // localhost
  
  // Check blacklist first
  if (blacklistedIPs.includes(clientIp)) {
    console.warn(`🚫 Blacklisted IP blocked: ${clientIp}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  // For admin endpoints, check whitelist
  if (req.path.includes('/admin') && !whitelistedIPs.includes(clientIp)) {
    console.warn(`⚠️ Admin access from non-whitelisted IP: ${clientIp}`);
    // In production, you might want to allow this with additional authentication
  }
  
  next();
};

module.exports = {
  accountLockout,
  authLimiter,
  generalLimiter,
  passwordResetLimiter,
  securityHeaders,
  validateRequest,
  commonValidations,
  securityLogger,
  requestSizeLimiter,
  ipFilter,
  createRateLimiter
};
