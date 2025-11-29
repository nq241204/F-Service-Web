# Hướng dẫn Testing Bảo mật cho F-Service

## 📋 Table of Contents
- [Tổng quan](#tổng-quan)
- [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
- [Testing Authentication](#testing-authentication)
- [Testing Authorization](#testing-authorization)
- [Testing Input Validation](#testing-input-validation)
- [Testing API Security](#testing-api-security)
- [Testing Data Protection](#testing-data-protection)
- [Testing Session Management](#testing-session-management)
- [Testing File Upload Security](#testing-file-upload-security)
- [Testing Rate Limiting](#testing-rate-limiting)
- [Testing XSS Protection](#testing-xss-protection)
- [Testing CSRF Protection](#testing-csrf-protection)
- [Testing SQL Injection](#testing-sql-injection)
- [Testing NoSQL Injection](#testing-nosql-injection)
- [Testing Password Security](#testing-password-security)
- [Testing JWT Security](#testing-jwt-security)
- [Testing Business Logic](#testing-business-logic)
- [Testing Infrastructure Security](#testing-infrastructure-security)
- [Automated Security Testing](#automated-security-testing)
- [Security Checklist](#security-checklist)

---

## 🎯 Tổng quan

Guide này cung cấp quy trình testing bảo mật toàn diện cho F-Service, đảm bảo hệ thống chống lại các lỗ hổng bảo mật phổ biến và tuân thủ các tiêu chuẩn bảo mật.

### **🔍 Mục tiêu testing:**
- Phát hiện lỗ hổng bảo mật
- Đánh giá mức độ rủi ro
- Đảm bảo compliance
- Cải thiện security posture

### **🛡️ Phạm vi testing:**
- Authentication & Authorization
- Input Validation & Output Encoding
- API Security & Rate Limiting
- Data Protection & Encryption
- Session Management
- Infrastructure Security

### **📊 Risk Assessment:**
- **Critical:** Data breach, financial loss
- **High:** Account takeover, privilege escalation
- **Medium:** Information disclosure, DoS
- **Low:** Minor security issues

---

## 🛠️ Chuẩn bị môi trường

### **1. Tools & Utilities**

#### **Security Testing Tools**
```bash
# Install security testing tools
npm install -g owasp-zap2docker
npm install -g sqlmap
npm install -g burp-suite-community
npm install -g nikto
npm install -g nmap
npm install -g hydra
```

#### **Node.js Security Tools**
```bash
# Install Node.js security packages
npm install --save-dev helmet
npm install --save-dev express-rate-limit
npm install --save-dev express-validator
npm install --save-dev bcrypt
npm install --save-dev jsonwebtoken
npm install --save-dev mongoose-sanitize
npm install --save-dev express-mongo-sanitize
```

#### **Testing Frameworks**
```bash
# Install testing frameworks
npm install --save-dev jest
npm install --save-dev supertest
npm install --save-dev frisby
npm install --save-dev chai
npm install --save-dev mocha
npm install --save-dev artillery
```

### **2. Environment Setup**

#### **Test Database**
```bash
# Create test database
mongosh fservice_test
use fservice_test
# Load test data
npm run seeddata
```

#### **Test Environment Variables**
```bash
# .env.test
NODE_ENV=test
PORT=5001
MONGODB_URI=mongodb://localhost:27017/fservice_test
JWT_SECRET=test_secret_key
JWT_EXPIRE=1h
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### **Security Headers Configuration**
```javascript
// test/security-config.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityConfig = {
  helmet: helmet({
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
  }),
  rateLimit: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
    message: 'Too many requests'
  })
};

module.exports = securityConfig;
```

---

## 🔐 Testing Authentication

### **1. Registration Security**

#### **Valid Registration Test**
```bash
# Test valid registration
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "role": "user"
  }'
```

#### **Invalid Registration Tests**
```bash
# Test duplicate email
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
# Expected: 400 - Email already exists

# Test weak password
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weak User",
    "email": "weak@example.com",
    "password": "123"
  }'
# Expected: 400 - Password too weak

# Test SQL injection in email
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SQL User",
    "email": "test'; DROP TABLE users; --",
    "password": "SecurePass123!"
  }'
# Expected: 400 - Invalid email format

# Test XSS in name
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert('XSS')</script>",
    "email": "xss@example.com",
    "password": "SecurePass123!"
  }'
# Expected: 400 - Invalid name format
```

#### **Automated Test**
```javascript
// tests/auth.test.js
describe('Authentication Security', () => {
  test('should reject duplicate email registration', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'SecurePass123!'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });

  test('should reject weak passwords', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak User',
        email: 'weak@example.com',
        password: '123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('password');
  });
});
```

### **2. Login Security**

#### **Brute Force Testing**
```bash
# Test brute force protection
for i in {1..10}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "wrongpassword'$i'"
    }'
done
# Expected: Account locked out after 5 failed attempts
```

#### **Timing Attack Testing**
```bash
# Test timing attacks
time curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com", "password": "wrong"}'

time curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}'

# Response times should be similar (within 100ms)
```

### **3. Password Reset Security**

#### **Token Security Testing**
```bash
# Test password reset token
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test token reuse
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "newPassword": "NewSecurePass123!"
  }'

# Try to use same token again
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "newPassword": "AnotherSecurePass123!"
  }'
# Expected: 400 - Token already used
```

---

## 👑 Testing Authorization

### **1. Role-based Access Control**

#### **Unauthorized Access Tests**
```bash
# Test admin endpoint without admin role
curl -X GET http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer user_token_here"
# Expected: 403 - Access denied

# Test member endpoint without member role
curl -X POST http://localhost:5001/api/services \
  -H "Authorization: Bearer user_token_here" \
  -H "Content-Type: application/json" \
  -d '{"TenDichVu": "Test Service", "Gia": 100000}'
# Expected: 403 - Access denied
```

#### **Privilege Escalation Tests**
```bash
# Test role modification
curl -X PUT http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer user_token_here" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
# Expected: 400 - Cannot modify role

# Test accessing other user's data
curl -X GET http://localhost:5001/api/user/other_user_id/profile \
  -H "Authorization: Bearer user_token_here"
# Expected: 403 - Access denied
```

#### **Automated Authorization Tests**
```javascript
// tests/authorization.test.js
describe('Authorization Security', () => {
  let userToken, memberToken, adminToken;

  beforeAll(async () => {
    // Setup tokens for different roles
    userToken = await getAuthToken('user');
    memberToken = await getAuthToken('member');
    adminToken = await getAuthToken('admin');
  });

  test('user should not access admin endpoints', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(403);
  });

  test('member should access member endpoints', async () => {
    const response = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        TenDichVu: 'Test Service',
        Gia: 100000,
        LinhVuc: 'Test'
      });
    
    expect(response.status).toBe(201);
  });

  test('admin should access admin endpoints', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
  });
});
```

---

## ✅ Testing Input Validation

### **1. SQL Injection Testing**

#### **SQL Injection Payloads**
```bash
# Test SQL injection in various fields
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fservice.com' OR '1'='1",
    "password": "anything"
  }'

curl -X POST http://localhost:5001/api/services \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "TenDichVu": "Test'; DROP TABLE users; --",
    "Gia": 100000
  }'

curl -X GET http://localhost:5001/api/services?search=test' UNION SELECT * FROM users --
```

#### **Automated SQL Injection Tests**
```javascript
// tests/sql-injection.test.js
describe('SQL Injection Protection', () => {
  const sqlPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR '1'='1' /*",
    "admin'--",
    "' OR 1=1#",
    "'; EXEC xp_cmdshell('dir'); --"
  ];

  test('should block SQL injection in login', async () => {
    for (const payload of sqlPayloads) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: `admin@fservice.com${payload}`,
          password: 'password'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).not.toContain('UNION');
    }
  });
});
```

### **2. NoSQL Injection Testing**

#### **NoSQL Injection Payloads**
```bash
# Test NoSQL injection
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null},
    "password": {"$ne": null}
  }'

curl -X GET http://localhost:5001/api/services?price={"$gt": 0}
```

#### **NoSQL Injection Protection Tests**
```javascript
// tests/nosql-injection.test.js
describe('NoSQL Injection Protection', () => {
  test('should block NoSQL injection operators', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: { "$ne": null },
        password: { "$ne": null }
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid input');
  });
});
```

### **3. XSS Protection Testing**

#### **XSS Payloads**
```bash
# Test XSS in various fields
curl -X POST http://localhost:5001/api/services \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "TenDichVu": "<script>alert(\"XSS\")</script>",
    "MoTa": "<img src=x onerror=alert(\"XSS\")>",
    "Gia": 100000
  }'

curl -X POST http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>document.location=\"http://evil.com\"</script>"
  }'
```

#### **XSS Protection Tests**
```javascript
// tests/xss-protection.test.js
describe('XSS Protection', () => {
  const xssPayloads = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "'\"><script>alert('XSS')</script>"
  ];

  test('should sanitize XSS in service creation', async () => {
    for (const payload of xssPayloads) {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          TenDichVu: payload,
          Gia: 100000,
          LinhVuc: 'Test'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid input');
    }
  });
});
```

---

## 🔒 Testing API Security

### **1. Rate Limiting Testing**

#### **Rate Limit Bypass Attempts**
```bash
# Test rate limiting
for i in {1..150}; do
  curl -X GET http://localhost:5001/api/services \
    -H "Authorization: Bearer token_here"
done
# Expected: 429 - Too many requests after 100 requests

# Test rate limiting bypass with different IPs
curl -X GET http://localhost:5001/api/services \
  -H "X-Forwarded-For: 127.0.0.1" \
  -H "Authorization: Bearer token_here"

curl -X GET http://localhost:5001/api/services \
  -H "X-Forwarded-For: 192.168.1.1" \
  -H "Authorization: Bearer token_here"
```

#### **Rate Limiting Tests**
```javascript
// tests/rate-limiting.test.js
describe('Rate Limiting', () => {
  test('should limit requests per IP', async () => {
    const requests = [];
    
    // Make 150 requests
    for (let i = 0; i < 150; i++) {
      requests.push(
        request(app)
          .get('/api/services')
          .set('Authorization', `Bearer ${userToken}`)
      );
    }
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

### **2. API Endpoint Security**

#### **Unprotected Endpoint Testing**
```bash
# Test for unprotected endpoints
curl -X GET http://localhost:5001/api/admin/users
# Expected: 401 - No token provided

curl -X POST http://localhost:5001/api/services \
  -H "Content-Type: application/json" \
  -d '{"TenDichVu": "Test", "Gia": 100000}'
# Expected: 401 - No token provided

curl -X PUT http://localhost:5001/api/user/other_user_id/profile \
  -H "Authorization: Bearer token_here"
# Expected: 403 - Access denied
```

#### **HTTP Methods Testing**
```bash
# Test unsupported HTTP methods
curl -X PATCH http://localhost:5001/api/services
curl -X OPTIONS http://localhost:5001/api/services
curl -X HEAD http://localhost:5001/api/services
# Expected: 405 - Method not allowed
```

### **3. Information Disclosure Testing**

#### **Error Message Testing**
```bash
# Test verbose error messages
curl -X GET http://localhost:5001/api/services/nonexistent_id
# Expected: Generic error, not stack trace

curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com", "password": "wrong"}'
# Expected: Generic "Invalid credentials" message
```

#### **Header Information Testing**
```bash
# Check for information disclosure in headers
curl -I http://localhost:5001/api/services
# Should not expose: Server, X-Powered-By, etc.
```

---

## 🛡️ Testing Data Protection

### **1. Sensitive Data Exposure**

#### **Password Exposure Testing**
```bash
# Test password in response
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  | grep -i password
# Expected: No password in response

curl -X GET http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer token_here" \
  | grep -i password
# Expected: No password in response
```

#### **PII Exposure Testing**
```bash
# Test for PII exposure in logs
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "0123456789",
    "address": "123 Main St"
  }'

# Check server logs for PII
tail -f logs/app.log | grep -i "john@example.com"
# Expected: PII should be masked or omitted
```

### **2. Data Encryption Testing**

#### **HTTPS Enforcement**
```bash
# Test HTTP vs HTTPS
curl -X GET http://localhost:5001/api/services
# Expected: Redirect to HTTPS or 301/302

curl -X GET https://localhost:5001/api/services
# Expected: 200 with valid SSL certificate
```

#### **Data at Rest Encryption**
```javascript
// tests/encryption.test.js
describe('Data Encryption', () => {
  test('should encrypt sensitive data at rest', async () => {
    // Check database for encrypted passwords
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user.password).not.toBe('password123');
    expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash
  });
});
```

---

## 🔄 Testing Session Management

### **1. JWT Token Security**

#### **Token Validation Testing**
```bash
# Test invalid token
curl -X GET http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 - Invalid token

# Test expired token
curl -X GET http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer expired_token"
# Expected: 401 - Token expired

# Test malformed token
curl -X GET http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer malformed.jwt.token"
# Expected: 401 - Malformed token
```

#### **Token Security Tests**
```javascript
// tests/jwt-security.test.js
describe('JWT Security', () => {
  test('should reject expired tokens', async () => {
    const expiredToken = jwt.sign(
      { userId: '123', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' } // Expired
    );

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    
    expect(response.status).toBe(401);
  });

  test('should reject tokens with invalid signature', async () => {
    const invalidToken = jwt.sign(
      { userId: '123', role: 'user' },
      'invalid_secret',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${invalidToken}`);
    
    expect(response.status).toBe(401);
  });
});
```

### **2. Session Hijacking Testing**

#### **Session Fixation Testing**
```bash
# Test session fixation
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' \
  -c cookies.txt

# Use same session for different user
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "other@example.com", "password": "password"}' \
  -b cookies.txt
# Expected: New token generated, old session invalidated
```

---

## 📁 Testing File Upload Security

### **1. File Upload Validation**

#### **Malicious File Testing**
```bash
# Test uploading malicious files
curl -X POST http://localhost:5001/api/user/upload-avatar \
  -H "Authorization: Bearer token_here" \
  -F "avatar=@malicious.php"

curl -X POST http://localhost:5001/api/user/upload-avatar \
  -H "Authorization: Bearer token_here" \
  -F "avatar=@virus.exe"

curl -X POST http://localhost:5001/api/user/upload-avatar \
  -H "Authorization: Bearer token_here" \
  -F "avatar=@huge_file.iso"
# Expected: 400 - Invalid file type or size
```

#### **File Upload Security Tests**
```javascript
// tests/file-upload.test.js
describe('File Upload Security', () => {
  test('should reject executable files', async () => {
    const response = await request(app)
      .post('/api/user/upload-avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', 'test-files/malicious.php');
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('file type');
  });

  test('should limit file size', async () => {
    const response = await request(app)
      .post('/api/user/upload-avatar')
      .set('Authorization', `Bearer ${userToken}`)
      .attach('avatar', 'test-files/huge-file.jpg');
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('file size');
  });
});
```

### **2. Path Traversal Testing**

#### **Path Traversal Attempts**
```bash
# Test path traversal in file operations
curl -X GET http://localhost:5001/api/files/../../../etc/passwd \
  -H "Authorization: Bearer token_here"

curl -X GET http://localhost:5001/api/files/..%2F..%2F..%2Fetc%2Fpasswd \
  -H "Authorization: Bearer token_here"

curl -X GET http://localhost:5001/api/files/..\\..\\..\\windows\\system32\\config\\sam \
  -H "Authorization: Bearer token_here"
# Expected: 400 or 404 - Path traversal blocked
```

---

## 🚦 Testing Rate Limiting

### **1. API Rate Limiting**

#### **Rate Limiting Bypass**
```bash
# Test rate limiting with different user agents
for i in {1..150}; do
  curl -X GET http://localhost:5001/api/services \
    -H "Authorization: Bearer token_here" \
    -H "User-Agent: DifferentAgent$i"
done

# Test rate limiting with proxy headers
curl -X GET http://localhost:5001/api/services \
  -H "Authorization: Bearer token_here" \
  -H "X-Forwarded-For: 1.2.3.4"

curl -X GET http://localhost:5001/api/services \
  -H "Authorization: Bearer token_here" \
  -H "X-Real-IP: 5.6.7.8"
```

#### **Rate Limiting Tests**
```javascript
// tests/rate-limiting.test.js
describe('Rate Limiting', () => {
  test('should implement progressive rate limiting', async () => {
    // First 100 requests should succeed
    for (let i = 0; i < 100; i++) {
      const response = await request(app)
        .get('/api/services')
        .set('Authorization', `Bearer ${userToken}`);
      expect(response.status).toBe(200);
    }

    // 101st request should be rate limited
    const response = await request(app)
      .get('/api/services')
      .set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(429);
  });
});
```

---

## 🛡️ Testing XSS Protection

### **1. Reflected XSS Testing**

#### **XSS in Parameters**
```bash
# Test XSS in URL parameters
curl -X GET "http://localhost:5001/api/services?search=<script>alert('XSS')</script>"

curl -X GET "http://localhost:5001/api/services?category=<img src=x onerror=alert('XSS')>"

curl -X GET "http://localhost:5001/api/services?sort=javascript:alert('XSS')"
```

#### **XSS in Response Headers**
```bash
# Test XSS in response headers
curl -X GET "http://localhost:5001/api/services" \
  -H "User-Agent: <script>alert('XSS')</script>"

curl -X GET "http://localhost:5001/api/services" \
  -H "Referer: javascript:alert('XSS')"
```

### **2. Stored XSS Testing**

#### **XSS in Database Fields**
```bash
# Test stored XSS in service creation
curl -X POST http://localhost:5001/api/services \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "TenDichVu": "<script>alert(\"Stored XSS\")</script>",
    "MoTa": "<img src=x onerror=alert(\"Stored XSS\")>",
    "Gia": 100000
  }'

# Retrieve service to check if XSS is stored
curl -X GET http://localhost:5001/api/services
```

---

## 🔒 Testing CSRF Protection

### **1. CSRF Token Validation**

#### **CSRF Token Testing**
```bash
# Test request without CSRF token
curl -X POST http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
# Expected: 403 - CSRF token required

# Test with invalid CSRF token
curl -X POST http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer token_here" \
  -H "X-CSRF-Token: invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
# Expected: 403 - Invalid CSRF token
```

#### **CSRF Protection Tests**
```javascript
// tests/csrf-protection.test.js
describe('CSRF Protection', () => {
  test('should require CSRF token for state-changing requests', async () => {
    const response = await request(app)
      .post('/api/user/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test' });
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('CSRF');
  });
});
```

---

## 💉 Testing SQL Injection

### **1. SQL Injection Payloads**

#### **Advanced SQL Injection**
```bash
# Test time-based SQL injection
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com' AND (SELECT * FROM (SELECT(SLEEP(5)))a)-- ",
    "password": "password"
  }'

# Test boolean-based SQL injection
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com' AND 1=1-- ",
    "password": "password"
  }'

# Test union-based SQL injection
curl -X GET "http://localhost:5001/api/services?id=1' UNION SELECT email,password FROM users--"
```

### **2. SQL Injection Prevention**

#### **Parameterized Queries Testing**
```javascript
// tests/sql-injection-prevention.test.js
describe('SQL Injection Prevention', () => {
  test('should use parameterized queries', async () => {
    // This test would need to be implemented based on your ORM
    // and database layer to ensure parameterized queries are used
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: maliciousInput,
        password: 'password'
      });
    
    expect(response.status).toBe(400);
    
    // Verify users table still exists
    const users = await User.find();
    expect(users.length).toBeGreaterThan(0);
  });
});
```

---

## 🗄️ Testing NoSQL Injection

### **1. NoSQL Injection Payloads**

#### **MongoDB Injection**
```bash
# Test MongoDB operator injection
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$regex": ".*"},
    "password": {"$ne": ""}
  }'

# Test MongoDB injection in search
curl -X GET "http://localhost:5001/api/services?price={$gt:0}"

# Test MongoDB injection in fields
curl -X POST http://localhost:5001/api/services \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "TenDichVu": {"$ne": ""},
    "Gia": {"$gt": 0}
  }'
```

### **2. NoSQL Injection Prevention**

#### **Input Sanitization**
```javascript
// tests/nosql-injection-prevention.test.js
describe('NoSQL Injection Prevention', () => {
  test('should sanitize MongoDB operators', async () => {
    const maliciousPayload = {
      email: { "$regex": "admin" },
      password: { "$ne": "" }
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(maliciousPayload);
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid input');
  });
});
```

---

## 🔐 Testing Password Security

### **1. Password Policy Testing**

#### **Weak Password Testing**
```bash
# Test various weak passwords
weak_passwords=(
  "123"
  "password"
  "123456"
  "qwerty"
  "admin"
  "test"
  "12345678"
  "abc123"
  "password123"
  "111111"
)

for pwd in "${weak_passwords[@]}"; do
  curl -X POST http://localhost:5001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test User\",
      \"email\": \"test${pwd}@example.com\",
      \"password\": \"$pwd\"
    }"
done
# Expected: All should be rejected
```

#### **Password Strength Testing**
```javascript
// tests/password-security.test.js
describe('Password Security', () => {
  const weakPasswords = [
    '123',
    'password',
    '123456',
    'qwerty',
    'admin',
    'test'
  ];

  test('should reject weak passwords', async () => {
    for (const password of weakPasswords) {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: `test${password}@example.com`,
          password: password
        });
      
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    }
  });

  test('should accept strong passwords', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'strong@example.com',
        password: 'StrongPass123!'
      });
    
    expect(response.status).toBe(201);
  });
});
```

### **2. Password Hashing Testing**

#### **Hash Verification**
```javascript
// tests/password-hashing.test.js
describe('Password Hashing', () => {
  test('should hash passwords with bcrypt', async () => {
    const plainPassword = 'TestPassword123!';
    
    // Register user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'hash@example.com',
        password: plainPassword
      });
    
    expect(response.status).toBe(201);
    
    // Check password is hashed in database
    const user = await User.findOne({ email: 'hash@example.com' });
    expect(user.password).not.toBe(plainPassword);
    expect(user.password).toMatch(/^\$2[aby]\$\d+\$/);
    
    // Verify hash can be checked
    const isValid = await bcrypt.compare(plainPassword, user.password);
    expect(isValid).toBe(true);
  });
});
```

---

## 🎫 Testing JWT Security

### **1. JWT Token Validation**

#### **Token Security Testing**
```bash
# Test JWT token manipulation
# Create token with elevated privileges
token=$(echo '{"userId":"123","role":"admin"}' | base64)

# Test with manipulated token
curl -X GET http://localhost:5001/api/admin/users \
  -H "Authorization: Bearer header.$token.signature"

# Test without signature
curl -X GET http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer header.payload"
```

#### **JWT Security Tests**
```javascript
// tests/jwt-security.test.js
describe('JWT Security', () => {
  test('should validate token structure', async () => {
    const invalidTokens = [
      'invalid.token',
      'header.payload',
      'header.payload.signature.extra',
      '',
      'not_a_token'
    ];

    for (const token of invalidTokens) {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(401);
    }
  });

  test('should validate token claims', async () => {
    const tokenWithInvalidRole = jwt.sign(
      { userId: '123', role: 'invalid_role' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${tokenWithInvalidRole}`);
    
    expect(response.status).toBe(401);
  });
});
```

---

## 🏢 Testing Business Logic

### **1. Financial Security Testing**

#### **Payment Manipulation**
```bash
# Test payment manipulation
curl -X POST http://localhost:5001/api/wallet/deposit \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "SoTien": -1000000,
    "MoTa": "Negative deposit"
  }'

curl -X POST http://localhost:5001/api/wallet/deposit \
  -H "Authorization: Bearer token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "SoTien": 999999999,
    "MoTa": "Huge deposit"
  }'
```

#### **Business Logic Tests**
```javascript
// tests/business-logic.test.js
describe('Business Logic Security', () => {
  test('should prevent negative deposits', async () => {
    const response = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        SoTien: -1000000,
        MoTa: 'Negative deposit'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('negative');
  });

  test('should enforce maximum deposit limits', async () => {
    const response = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        SoTien: 999999999,
        MoTa: 'Huge deposit'
      });
    
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('limit');
  });
});
```

---

## 🌐 Testing Infrastructure Security

### **1. Network Security Testing**

#### **Port Scanning**
```bash
# Scan open ports
nmap -sS -O localhost

# Check for unnecessary services
netstat -tuln
```

#### **SSL/TLS Testing**
```bash
# Test SSL configuration
openssl s_client -connect localhost:443

# Test SSL vulnerabilities
testssl.sh https://localhost:443
```

### **2. Server Security Testing**

#### **Security Headers**
```bash
# Check security headers
curl -I http://localhost:5001/api/services

# Expected headers:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: default-src 'self'
```

---

## 🤖 Automated Security Testing

### **1. Security Test Suite**

#### **Jest Security Tests**
```javascript
// tests/security.test.js
describe('Security Tests', () => {
  describe('Authentication', () => {
    require('./auth-security.test');
    require('./jwt-security.test');
    require('./password-security.test');
  });

  describe('Authorization', () => {
    require('./authorization.test');
    require('./rbac.test');
  });

  describe('Input Validation', () => {
    require('./sql-injection.test');
    require('./nosql-injection.test');
    require('./xss-protection.test');
  });

  describe('API Security', () => {
    require('./rate-limiting.test');
    require('./csrf-protection.test');
    require('./file-upload.test');
  });

  describe('Business Logic', () => {
    require('./financial-security.test');
    require('./service-logic.test');
  });
});
```

### **2. Continuous Security Testing**

#### **CI/CD Security Pipeline**
```yaml
# .github/workflows/security.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Run OWASP ZAP Baseline Scan
      run: |
        docker run -t owasp/zap2docker-stable \
          zap-baseline.py -t http://localhost:5001
    
    - name: Run npm audit
      run: npm audit --audit-level high
    
    - name: Run Snyk security scan
      run: npx snyk test
```

### **3. Load Testing with Security**

#### **Artillery Security Load Test**
```yaml
# artillery-security.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
  payload:
    path: 'test-payloads.csv'
    fields:
      - 'email'
      - 'password'

scenarios:
  - name: "Login Security Test"
    weight: 100
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.token"
              as: "token"
      - get:
          url: "/api/user/profile"
          headers:
            Authorization: "Bearer {{ token }}"
```

---

## ✅ Security Checklist

### **🔐 Authentication & Authorization**
- [ ] Password complexity requirements enforced
- [ ] Account lockout after failed attempts
- [ ] Secure password reset implementation
- [ ] JWT tokens properly signed and validated
- [ ] Role-based access control implemented
- [ ] Privilege escalation prevented
- [ ] Session management secure
- [ ] Multi-factor authentication available

### **🛡️ Input Validation & Output Encoding**
- [ ] All user input validated server-side
- [ ] SQL injection protection implemented
- [ ] NoSQL injection protection implemented
- [ ] XSS protection implemented
- [ ] CSRF protection implemented
- [ ] File upload validation implemented
- [ ] Output encoding implemented
- [ ] Parameterized queries used

### **🔒 API Security**
- [ ] Rate limiting implemented
- [ ] API authentication required
- [ ] HTTPS enforced
- [ ] Security headers implemented
- [ ] Error messages generic
- [ ] Information disclosure prevented
- [ ] API versioning implemented
- [ ] CORS properly configured

### **💾 Data Protection**
- [ ] Sensitive data encrypted at rest
- [ ] Data encrypted in transit
- [ ] PII properly masked in logs
- [ ] Data retention policies implemented
- [ ] Backup encryption implemented
- [ ] Access logging implemented
- [ ] Data minimization practiced
- [ ] Right to deletion implemented

### **🌐 Infrastructure Security**
- [ ] SSL/TLS properly configured
- [ ] Security headers implemented
- [ ] Firewall rules configured
- [ ] Unnecessary services disabled
- [ ] Regular security updates applied
- [ ] Intrusion detection implemented
- [ ] Log monitoring implemented
- [ ] Backup procedures tested

### **🤖 Automated Testing**
- [ ] Security tests in CI/CD pipeline
- [ ] Dependency vulnerability scanning
- [ ] Static code analysis implemented
- [ ] Dynamic security testing
- [ ] Load testing with security checks
- [ ] Regular penetration testing
- [ ] Security monitoring implemented
- [ ] Incident response plan ready

---

## 📊 Security Testing Report Template

### **Executive Summary**
- **Test Date:** [Date]
- **Test Duration:** [Duration]
- **Scope:** [Test scope]
- **Critical Findings:** [Number]
- **High Risk Findings:** [Number]
- **Overall Risk Level:** [Risk level]

### **Findings Summary**
| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | ✅ Fixed |
| High | 2 | 🔄 In Progress |
| Medium | 5 | ✅ Fixed |
| Low | 8 | 📋 Planned |

### **Detailed Findings**
#### **Critical: SQL Injection Vulnerability**
- **Location:** `/api/auth/login`
- **Description:** SQL injection possible in email field
- **Impact:** Database compromise
- **Remediation:** Implement parameterized queries
- **Status:** Fixed

#### **High: Weak Password Policy**
- **Location:** `/api/auth/register`
- **Description:** Password complexity not enforced
- **Impact:** Account compromise
- **Remediation:** Implement password strength requirements
- **Status:** In Progress

### **Recommendations**
1. Implement comprehensive input validation
2. Add security headers to all responses
3. Implement rate limiting on all endpoints
4. Add security monitoring and alerting
5. Regular security training for developers

### **Next Steps**
- Schedule remediation sprints
- Implement automated security testing
- Conduct regular penetration testing
- Establish security metrics and KPIs

---

## 📞 Security Incident Response

### **1. Incident Classification**
- **Critical:** Data breach, system compromise
- **High:** Service disruption, privilege escalation
- **Medium:** Security policy violation
- **Low:** Minor security issue

### **2. Response Procedures**
1. **Detection:** Monitor security alerts
2. **Assessment:** Evaluate impact and scope
3. **Containment:** Isolate affected systems
4. **Eradication:** Remove threat
5. **Recovery:** Restore services
6. **Lessons Learned:** Post-incident review

### **3. Contact Information**
- **Security Team:** security@fservice.com
- **Emergency:** 0912 345 678 (24/7)
- **Management:** management@fservice.com

---

## 📅 Security Testing Schedule

### **Regular Testing**
- **Daily:** Automated security tests
- **Weekly:** Dependency vulnerability scanning
- **Monthly:** Manual security testing
- **Quarterly:** Penetration testing
- **Annually:** Full security audit

### **Event-Driven Testing**
- **Code changes:** Security test suite
- **Infrastructure changes:** Security scan
- **New features:** Security review
- **Incidents:** Post-incident testing

---

## 📚 Additional Resources

### **Security Tools**
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)
- [SQLMap](http://sqlmap.org/)
- [Nikto](https://cirt.net/Nikto2)
- [Nmap](https://nmap.org/)

### **Security Standards**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [ISO 27001](https://www.iso.org/isoiec-27001-information-security.html)

### **Learning Resources**
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [SANS Security Training](https://www.sans.org/)

---

**© 2024 F-Service. All rights reserved.**
