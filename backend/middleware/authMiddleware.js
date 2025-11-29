// backend/middleware/authMiddleware.js - API version (JWT only)
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const isGuest = (req, res, next) => {
    // For API, we don't need this middleware
    // This is only for web routes
    next();
};

const authMiddleware = (roles = []) => {
    return async function(req, res, next) {
        try {
            // Get token from header
            const authHeader = req.header('Authorization');
            
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Auth middleware - authHeader:', authHeader ? 'exists' : 'missing');
            }
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Không có token, truy cập bị từ chối' 
                });
            }

            const token = authHeader.replace('Bearer ', '');

            // Verify token
            const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
            const decoded = jwt.verify(token, jwtSecret);
            
            if (process.env.NODE_ENV === 'development') {
                console.log('🔍 Auth middleware - token verified, user ID:', decoded.id);
            }

            // Get user from token
            const user = await User.findById(decoded.id)
                .select('-password')
                .populate('ViGiaoDich');

            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token không hợp lệ' 
                });
            }

            // Check if user is banned
            if (user.status === 'banned') {
                return res.status(403).json({ 
                    success: false,
                    message: 'Tài khoản của bạn đã bị khóa' 
                });
            }

            // Check role authorization
            if (roles.length > 0 && !roles.includes(user.role)) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Không có quyền truy cập' 
                });
            }

            req.user = user;
            next();
        } catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token không hợp lệ' 
                });
            }
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token đã hết hạn' 
                });
            }
            console.error('Auth middleware error:', err);
            return res.status(500).json({ 
                success: false,
                message: 'Lỗi xác thực' 
            });
        }
    };
}

module.exports = {
    isGuest,
    authMiddleware
};
