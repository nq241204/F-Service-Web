#!/usr/bin/env node

// Generate Secure Secrets for Production
const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for F-Service\n');

// Generate JWT Secret (64 bytes = 128 hex characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generate Session Secret (64 bytes)
const sessionSecret = crypto.randomBytes(64).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);

// Generate Encryption Key for Frontend (32 bytes = 64 hex characters)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('VITE_ENCRYPTION_KEY=' + encryptionKey);

// Generate API Key for external services (32 bytes)
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API_SECRET=' + apiKey);

// Generate Database Encryption Key (32 bytes)
const dbEncryptionKey = crypto.randomBytes(32).toString('hex');
console.log('DB_ENCRYPTION_KEY=' + dbEncryptionKey);

// Generate OAuth Client Secret (32 bytes)
const oauthClientSecret = crypto.randomBytes(32).toString('hex');
console.log('OAUTH_CLIENT_SECRET=' + oauthClientSecret);

// Generate Email Encryption Key (32 bytes)
const emailEncryptionKey = crypto.randomBytes(32).toString('hex');
console.log('EMAIL_ENCRYPTION_KEY=' + emailEncryptionKey);

console.log('\n✅ Secrets generated successfully!');
console.log('\n📋 Instructions:');
console.log('1. Copy these secrets to your .env files');
console.log('2. NEVER commit these secrets to version control');
console.log('3. Store these secrets securely (password manager, vault, etc.)');
console.log('4. Rotate these secrets periodically (recommended: every 90 days)');
console.log('5. Use different secrets for each environment (dev/staging/prod)');

console.log('\n🔒 Security Best Practices:');
console.log('- Use a password manager to store these secrets');
console.log('- Enable two-factor authentication on your password manager');
console.log('- Share secrets only with authorized team members');
console.log('- Monitor for secret leaks in logs or error messages');
console.log('  Implement secret rotation procedures');

console.log('\n🚨 IMPORTANT:');
console.log('These secrets are CRITICAL for your application security.');
console.log('Treat them like passwords - keep them confidential and secure!');

// Create .env files with the generated secrets
const fs = require('fs');
const path = require('path');

// Backend .env
const backendEnv = `# Backend Environment Variables - PRODUCTION
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb://localhost:27017/f-service

# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=${sessionSecret}
SESSION_MAX_AGE=86400000

# Frontend URL (for CORS)
FRONTEND_URL=https://your-production-domain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_ENCRYPTION_KEY=${emailEncryptionKey}

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Payment Configuration
MINIMUM_DEPOSIT=100000
MINIMUM_WITHDRAW=50000

# API Security
API_SECRET=${apiKey}
DB_ENCRYPTION_KEY=${dbEncryptionKey}

# OAuth Configuration
OAUTH_CLIENT_SECRET=${oauthClientSecret}

# Security Settings
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=900000
`;

// Frontend .env
const frontendEnv = `# Frontend Environment Variables - PRODUCTION
VITE_API_URL=https://your-api-domain.com/api
VITE_NODE_ENV=production

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# reCAPTCHA Configuration
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key

# Security Configuration
VITE_ENCRYPTION_KEY=${encryptionKey}

# Application Configuration
VITE_APP_NAME=F-Service
VITE_APP_VERSION=1.0.0
VITE_SUPPORT_EMAIL=support@f-service.com
`;

// Write files
try {
  fs.writeFileSync(path.join(__dirname, '../.env.production'), backendEnv);
  fs.writeFileSync(path.join(__dirname, '../../frontend/.env.production'), frontendEnv);
  
  console.log('\n✅ Production .env files created:');
  console.log('- backend/.env.production');
  console.log('- frontend/.env.production');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Review and update the .env.production files');
  console.log('2. Update your domain URLs and email settings');
  console.log('3. Copy .env.production to .env for production deployment');
  console.log('4. Delete the .env.production files after copying');
  
} catch (error) {
  console.error('❌ Error creating .env files:', error.message);
  console.log('\n📋 Manual Setup Required:');
  console.log('Copy the secrets above to your environment files manually');
}

console.log('\n🎉 Secret generation complete!');
