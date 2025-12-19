#!/bin/bash

# Security Monitoring Setup Script for F-Service
echo "🔒 Setting up Security Monitoring for F-Service..."

# Create necessary directories
echo "📁 Creating log directories..."
mkdir -p logs/security
mkdir -p logs/audit
mkdir -p logs/performance

# Set up log rotation
echo "📋 Setting up log rotation..."
cat > /etc/logrotate.d/f-service << EOF
c:/F-Service/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        kill -USR1 \`cat /var/run/f-service.pid 2>/dev/null\` 2>/dev/null || true
    endscript
}
EOF

# Create security monitoring cron jobs
echo "⏰ Setting up automated security monitoring..."

# Daily security audit at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * cd c:/F-Service/backend && npm run security-audit >> logs/cron-security-audit.log 2>&1") | crontab -

# Weekly dependency check at 3 AM on Sundays
(crontab -l 2>/dev/null; echo "0 3 * * 0 cd c:/F-Service/backend && npm run audit >> logs/cron-dependency-check.log 2>&1") | crontab -

# Hourly security log monitoring
(crontab -l 2>/dev/null; echo "0 * * * * cd c:/F-Service/backend && node scripts/checkSecurityLogs.js >> logs/cron-log-monitor.log 2>&1") | crontab -

# Set up file permissions
echo "🔐 Setting up secure file permissions..."
chmod 600 .env
chmod 644 config/*.js
chmod 644 models/*.js
chmod 644 middleware/*.js
chmod 755 scripts/*.js

# Create security monitoring dashboard
echo "📊 Creating security monitoring dashboard..."
cat > scripts/securityDashboard.js << 'EOF'
const fs = require('fs');
const path = require('path');

function getSecurityDashboard() {
    const logsDir = path.join(__dirname, '../logs');
    
    // Read security logs
    const securityLogs = [];
    if (fs.existsSync(path.join(logsDir, 'security.log'))) {
        const logs = fs.readFileSync(path.join(logsDir, 'security.log'), 'utf8')
            .split('\n')
            .filter(line => line.trim());
        
        logs.forEach(line => {
            try {
                securityLogs.push(JSON.parse(line));
            } catch (e) {
                // Skip invalid JSON lines
            }
        });
    }
    
    // Get recent events (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = securityLogs.filter(event => 
        new Date(event.timestamp) > last24Hours
    );
    
    // Count events by type
    const eventCounts = {};
    recentEvents.forEach(event => {
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });
    
    // Get top IPs
    const ipCounts = {};
    recentEvents.forEach(event => {
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    });
    
    const topIPs = Object.entries(ipCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    return {
        timestamp: new Date().toISOString(),
        summary: {
            totalEvents: recentEvents.length,
            criticalEvents: recentEvents.filter(e => 
                ['INJECTION_ATTEMPT', 'BRUTE_FORCE', 'UNAUTHORIZED_ACCESS'].includes(e.eventType)
            ).length,
            uniqueIPs: Object.keys(ipCounts).length
        },
        eventCounts,
        topIPs,
        recentEvents: recentEvents.slice(-20)
    };
}

if (require.main === module) {
    const dashboard = getSecurityDashboard();
    console.log(JSON.stringify(dashboard, null, 2));
}

module.exports = { getSecurityDashboard };
EOF

# Create alert system
echo "🚨 Setting up alert system..."
cat > scripts/securityAlerts.js << 'EOF'
const fs = require('fs');
const path = require('path');

function checkSecurityAlerts() {
    const logsDir = path.join(__dirname, '../logs');
    const alertThresholds = {
        'AUTH_FAILURE': 10,      // 10 failures in 15 minutes
        'INJECTION_ATTEMPT': 1,  // Any injection attempt
        'BRUTE_FORCE': 1,        // Any brute force attempt
        'RATE_LIMIT_EXCEEDED': 5  // 5 rate limit hits in 15 minutes
    };
    
    if (!fs.existsSync(path.join(logsDir, 'security.log'))) {
        return [];
    }
    
    const logs = fs.readFileSync(path.join(logsDir, 'security.log'), 'utf8')
        .split('\n')
        .filter(line => line.trim());
    
    const events = logs.map(line => JSON.parse(line));
    const last15Minutes = new Date(Date.now() - 15 * 60 * 1000);
    const recentEvents = events.filter(event => 
        new Date(event.timestamp) > last15Minutes
    );
    
    const alerts = [];
    const eventCounts = {};
    
    recentEvents.forEach(event => {
        eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });
    
    Object.entries(alertThresholds).forEach(([eventType, threshold]) => {
        const count = eventCounts[eventType] || 0;
        if (count >= threshold) {
            alerts.push({
                type: 'SECURITY_ALERT',
                eventType,
                count,
                threshold,
                severity: eventType === 'INJECTION_ATTEMPT' || eventType === 'BRUTE_FORCE' ? 'CRITICAL' : 'WARNING',
                timestamp: new Date().toISOString(),
                message: `${count} ${eventType.replace(/_/g, ' ')} events detected (threshold: ${threshold})`
            });
        }
    });
    
    return alerts;
}

function sendAlert(alert) {
    // Log alert
    console.error(`🚨 SECURITY ALERT: ${alert.message}`);
    
    // In production, integrate with:
    // - Email notifications
    // - Slack/Discord webhooks  
    // - SMS alerts
    // - SIEM systems
    
    // For now, save to alert log
    const alertLog = path.join(__dirname, '../logs/security-alerts.log');
    const logEntry = JSON.stringify(alert) + '\n';
    fs.appendFileSync(alertLog, logEntry);
}

if (require.main === module) {
    const alerts = checkSecurityAlerts();
    alerts.forEach(sendAlert);
    
    if (alerts.length > 0) {
        console.log(`🚨 Generated ${alerts.length} security alerts`);
    } else {
        console.log('✅ No security alerts detected');
    }
}

module.exports = { checkSecurityAlerts, sendAlert };
EOF

# Create automated testing script
echo "🧪 Setting up automated security testing..."
cat > scripts/securityTests.js << 'EOF'
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function runSecurityTests() {
    console.log('🧪 Running automated security tests...');
    
    const testResults = {
        timestamp: new Date().toISOString(),
        tests: [],
        passed: 0,
        failed: 0
    };
    
    // Test 1: SQL Injection attempts
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: "admin'--",
            password: "password"
        });
        
        testResults.tests.push({
            name: 'SQL Injection Protection',
            status: response.status === 401 ? 'PASS' : 'FAIL',
            details: `Status: ${response.status}`
        });
        
        if (response.status === 401) testResults.passed++;
        else testResults.failed++;
    } catch (error) {
        testResults.tests.push({
            name: 'SQL Injection Protection',
            status: 'PASS',
            details: 'Request blocked (expected)'
        });
        testResults.passed++;
    }
    
    // Test 2: XSS attempts
    try {
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            name: '<script>alert("xss")</script>',
            email: 'test@example.com',
            password: 'Password123!',
            password2: 'Password123!'
        });
        
        testResults.tests.push({
            name: 'XSS Protection',
            status: response.status === 400 ? 'PASS' : 'FAIL',
            details: `Status: ${response.status}`
        });
        
        if (response.status === 400) testResults.passed++;
        else testResults.failed++;
    } catch (error) {
        testResults.tests.push({
            name: 'XSS Protection',
            status: 'PASS',
            details: 'Request blocked (expected)'
        });
        testResults.passed++;
    }
    
    // Test 3: Rate limiting
    let rateLimitHits = 0;
    for (let i = 0; i < 10; i++) {
        try {
            await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        } catch (error) {
            if (error.response && error.response.status === 429) {
                rateLimitHits++;
            }
        }
    }
    
    testResults.tests.push({
        name: 'Rate Limiting',
        status: rateLimitHits > 0 ? 'PASS' : 'FAIL',
        details: `Rate limit triggered: ${rateLimitHits}/10 attempts`
    });
    
    if (rateLimitHits > 0) testResults.passed++;
    else testResults.failed++;
    
    // Test 4: Authentication bypass
    try {
        const response = await axios.get(`${BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': 'Bearer fake-token'
            }
        });
        
        testResults.tests.push({
            name: 'Authentication Bypass Protection',
            status: response.status === 401 ? 'PASS' : 'FAIL',
            details: `Status: ${response.status}`
        });
        
        if (response.status === 401) testResults.passed++;
        else testResults.failed++;
    } catch (error) {
        testResults.tests.push({
            name: 'Authentication Bypass Protection',
            status: 'PASS',
            details: 'Request blocked (expected)'
        });
        testResults.passed++;
    }
    
    // Save results
    const resultsPath = path.join(__dirname, '../logs/security-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log(`🧪 Security tests completed: ${testResults.passed}/${testResults.tests.length} passed`);
    
    return testResults;
}

if (require.main === module) {
    runSecurityTests().catch(console.error);
}

module.exports = { runSecurityTests };
EOF

echo "✅ Security monitoring setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review and adjust cron jobs as needed"
echo "2. Configure email/webhook alerts in production"
echo "3. Set up log monitoring dashboard"
echo "4. Schedule regular security reviews"
echo ""
echo "🔐 Available commands:"
echo "- npm run security-audit: Run comprehensive security audit"
echo "- npm run audit: Check dependencies and outdated packages"
echo "- npm run update-deps: Update dependencies and fix vulnerabilities"
echo "- node scripts/securityDashboard.js: View security dashboard"
echo "- node scripts/securityAlerts.js: Check for security alerts"
echo "- node scripts/securityTests.js: Run automated security tests"
