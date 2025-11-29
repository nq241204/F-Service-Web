// Security Utilities for Enhanced Protection
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Strong Password Policy (đã điều chỉnh cho phép password đơn giản hơn)
const validatePassword = (password) => {
  const minLength = 6; // Giảm từ 8 xuống 6 ký tự
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  // Loại bỏ yêu cầu chữ hoa và ký tự đặc biệt cho development
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
  }
  if (!hasLowerCase) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  if (!hasNumbers) {
    errors.push('Mật khẩu phải có ít nhất 1 số');
  }
  
  // Loại bỏ kiểm tra common passwords để cho phép 123456 trong development
  // Comment out trong development, có thể bật lại trong production
  /*
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Mật khẩu không được chứa các từ phổ biến');
  }
  */
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate Secure JWT Secret
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Enhanced Password Hashing
const hashPassword = async (password) => {
  const saltRounds = 12; // Increased from 10 for better security
  return await bcrypt.hash(password, saltRounds);
};

// Secure Token Generation
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Email Validation with Domain Check
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email không hợp lệ' };
  }
  
  // Check for suspicious domains
  const suspiciousDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  const domain = email.split('@')[1].toLowerCase();
  
  if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
    return { isValid: false, error: 'Email tạm thời không được chấp nhận' };
  }
  
  return { isValid: true };
};

// Input Sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Rate Limiting by User
const userRateLimit = new Map(); // In production, use Redis or database

const checkUserRateLimit = (userId, action, limit = 5, windowMs = 15 * 60 * 1000) => {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!userRateLimit.has(key)) {
    userRateLimit.set(key, []);
  }
  
  const attempts = userRateLimit.get(key).filter(timestamp => timestamp > windowStart);
  
  if (attempts.length >= limit) {
    return { allowed: false, remainingTime: windowMs - (now - attempts[0]) };
  }
  
  attempts.push(now);
  userRateLimit.set(key, attempts);
  
  return { allowed: true, remainingAttempts: limit - attempts.length };
};

// Account Lockout Mechanism
const accountLockout = new Map(); // In production, use database

const checkAccountLockout = (email) => {
  const lockoutData = accountLockout.get(email);
  
  if (!lockoutData) {
    return { isLocked: false };
  }
  
  const now = Date.now();
  const lockoutDuration = 30 * 60 * 1000; // 30 minutes
  
  if (now - lockoutData.lockedAt > lockoutDuration) {
    accountLockout.delete(email);
    return { isLocked: false };
  }
  
  return {
    isLocked: true,
    remainingTime: lockoutDuration - (now - lockoutData.lockedAt),
    attempts: lockoutData.attempts
  };
};

const recordFailedAttempt = (email) => {
  const maxAttempts = 5;
  const lockoutData = accountLockout.get(email) || { attempts: 0 };
  
  lockoutData.attempts += 1;
  
  if (lockoutData.attempts >= maxAttempts) {
    lockoutData.lockedAt = Date.now();
    accountLockout.set(email, lockoutData);
    return { locked: true, attempts: lockoutData.attempts };
  }
  
  accountLockout.set(email, lockoutData);
  return { locked: false, attempts: lockoutData.attempts };
};

const clearFailedAttempts = (email) => {
  accountLockout.delete(email);
};

// Secure Headers for API Responses
const setSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
};

module.exports = {
  validatePassword,
  generateJWTSecret,
  hashPassword,
  generateSecureToken,
  validateEmail,
  sanitizeInput,
  checkUserRateLimit,
  checkAccountLockout,
  recordFailedAttempt,
  clearFailedAttempts,
  setSecurityHeaders
};
