// backend/server.js
require('dotenv').config(); // Load environment variables FIRST
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const { securityMonitor, generateAuditReport } = require('./middleware/securityMonitoring');

const app = express();

// Enhanced security middleware
app.use(helmet());

// Security monitoring - MUST be before other middleware
app.use(securityMonitor);

// MongoDB sanitization - FIXED for Express v5 compatibility
app.use((req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = JSON.parse(JSON.stringify(req.body).replace(/\$/g, '_'));
    }
    // Sanitize query params
    if (req.query) {
        req.query = JSON.parse(JSON.stringify(req.query).replace(/\$/g, '_'));
    }
    // Sanitize params
    if (req.params) {
        req.params = JSON.parse(JSON.stringify(req.params).replace(/\$/g, '_'));
    }
    next();
});

app.use(hpp());

// Rate limiting - ENABLED for security
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// Stricter auth rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`📝 ${timestamp} - ${method} ${path} - IP: ${ip}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Khởi tạo kết nối MongoDB và routes
async function initializeApp() {
    try {
        // Kết nối MongoDB
        connectDB();

        // Log database connection details
        mongoose.connection.on('connected', () => {
          console.log('🗄️  MongoDB Connected');
        });

        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB Connection Error:', err);
        });

        mongoose.connection.on('disconnected', () => {
          console.log('🔌 MongoDB Disconnected');
        });

        // Đăng ký các API routes
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/auth', require('./routes/oauth'));
        app.use('/api/services', require('./routes/services'));
        app.use('/api/wallet', require('./routes/wallet'));
        app.use('/api/user', require('./routes/user'));
        app.use('/api/admin', require('./routes/admin'));
        app.use('/api/service', require('./routes/service'));
        app.use('/api/monitor', require('./routes/monitoring'));
        app.use('/api/member', require('./routes/member'));
        app.use('/api/chat', require('./routes/chat'));

        // 404 handler (for non-matching routes)
        app.use((req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
                path: req.path,
                method: req.method
            });
        });

        // Global error handler (MUST BE LAST)
        app.use((err, req, res, next) => {
            console.error('❌ Global Error Handler - Error:', err.message);
            console.error('📍 Stack:', err.stack);
            console.error('📝 Request:', {
                method: req.method,
                path: req.path,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            res.status(err.status || 500).json({
                success: false,
                message: process.env.NODE_ENV === 'development' ? err.message : 'Đã xảy ra lỗi',
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        });

        // Khởi động server
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            console.log(`🚀 Backend API server đang chạy trên cổng ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  MongoDB Connected to: ${mongoose.connection.name}`);
            console.log(`🔗 Local URL: http://localhost:${PORT}/api/health`);
        });

        // Xử lý tắt server
        process.on('SIGTERM', () => {
            console.log('🛑 Nhận tín hiệu SIGTERM. Đang đóng server...');
            
            server.close(() => {
                console.log('✅ Server đã đóng.');
                mongoose.connection.close(false, () => {
                    console.log('✅ MongoDB connection đã đóng.');
                    process.exit(0);
                });
            });
        });

        // Xử lý SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            console.log('\n🛑 Nhận tín hiệu SIGINT (Ctrl+C). Đang đóng server...');
            
            // Generate final security audit report
            console.log('📊 Generating final security audit report...');
            const reportPath = generateAuditReport();
            console.log(`📋 Security report saved to: ${reportPath}`);
            
            server.close(() => {
                console.log('✅ Server đã đóng.');
                mongoose.connection.close(false, () => {
                    console.log('✅ MongoDB connection đã đóng.');
                    process.exit(0);
                });
            });
        });

        // Schedule daily security reports
        setInterval(() => {
            console.log('📊 Generating daily security audit report...');
            const reportPath = generateAuditReport();
            console.log(`📋 Daily security report saved to: ${reportPath}`);
        }, 24 * 60 * 60 * 1000); // Every 24 hours

    } catch (error) {
        console.error('Không thể khởi động server:', error);
        process.exit(1);
    }
}

// Khởi động ứng dụng
initializeApp();

// Global error handlers - MUST BE AFTER initializeApp()
process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION:', error.message);
    console.error('📍 Stack:', error.stack);
    console.error('⏰ Time:', new Date().toISOString());
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION:', reason);
    if (reason && reason.stack) {
        console.error('📍 Stack:', reason.stack);
    }
    console.error('⏰ Time:', new Date().toISOString());
});

