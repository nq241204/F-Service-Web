// Security Monitoring Middleware
const fs = require('fs');
const path = require('path');

// Security event types
const SECURITY_EVENTS = {
    AUTH_FAILURE: 'AUTH_FAILURE',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
    INJECTION_ATTEMPT: 'INJECTION_ATTEMPT',
    BRUTE_FORCE: 'BRUTE_FORCE',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
};

// Log file paths
const LOG_DIR = path.join(__dirname, '../logs');
const SECURITY_LOG = path.join(LOG_DIR, 'security.log');
const AUDIT_LOG = path.join(LOG_DIR, 'audit.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Security event logger
const logSecurityEvent = (eventType, req, details = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        eventType,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        method: req.method,
        url: req.originalUrl,
        headers: {
            'content-type': req.get('Content-Type'),
            'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
        },
        body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
        query: req.query,
        params: req.params,
        ...details
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(SECURITY_LOG, logLine);

    // Critical events - immediate alert
    if (['INJECTION_ATTEMPT', 'BRUTE_FORCE', 'UNAUTHORIZED_ACCESS'].includes(eventType)) {
        console.error(`🚨 CRITICAL SECURITY EVENT: ${eventType} from ${logEntry.ip}`);
        sendAlert(eventType, logEntry);
    }
};

// Sanitize request body for logging
const sanitizeRequestBody = (body) => {
    if (!body) return undefined;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });
    
    return sanitized;
};

// Alert system (basic console/alert for now)
const sendAlert = (eventType, details) => {
    const alertMessage = `
🚨 SECURITY ALERT 🚨
Event: ${eventType}
IP: ${details.ip}
Time: ${details.timestamp}
URL: ${details.method} ${details.url}
User-Agent: ${details.userAgent}
    `;
    
    console.error(alertMessage);
    
    // In production, integrate with:
    // - Email notifications
    // - Slack/Discord webhooks
    // - SMS alerts
    // - SIEM systems
};

// Track suspicious IPs
const suspiciousIPs = new Map();
const IP_TRACKING_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 10;

// Security monitoring middleware
const securityMonitor = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Track IP activity
    if (!suspiciousIPs.has(clientIP)) {
        suspiciousIPs.set(clientIP, { count: 0, firstSeen: now, events: [] });
    }
    
    const ipData = suspiciousIPs.get(clientIP);
    
    // Clean old entries
    if (now - ipData.firstSeen > IP_TRACKING_WINDOW) {
        suspiciousIPs.delete(clientIP);
    }
    
    // Monitor response for security events
    const originalJson = res.json;
    res.json = function(data) {
        // Log authentication failures
        if (res.statusCode >= 400 && req.path.includes('/auth')) {
            ipData.count++;
            ipData.events.push({
                timestamp: now,
                type: SECURITY_EVENTS.AUTH_FAILURE,
                statusCode: res.statusCode
            });
            
            logSecurityEvent(SECURITY_EVENTS.AUTH_FAILURE, req, {
                statusCode: res.statusCode,
                attemptCount: ipData.count
            });
            
            // Check for brute force
            if (ipData.count >= MAX_FAILED_ATTEMPTS) {
                logSecurityEvent(SECURITY_EVENTS.BRUTE_FORCE, req, {
                    attemptCount: ipData.count,
                    timeWindow: IP_TRACKING_WINDOW / 1000 / 60
                });
            }
        }
        
        // Log validation errors
        if (data && data.errors && Array.isArray(data.errors)) {
            logSecurityEvent(SECURITY_EVENTS.VALIDATION_ERROR, req, {
                validationErrors: data.errors
            });
        }
        
        // Check for injection attempts in request
        const injectionPatterns = [/\$where/, /\$ne/, /\$gt/, /\$lt/, /\$in/, /\$or/, /script:/, /javascript:/, /<script/];
        const requestString = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);
        
        if (injectionPatterns.some(pattern => pattern.test(requestString))) {
            logSecurityEvent(SECURITY_EVENTS.INJECTION_ATTEMPT, req, {
                detectedPatterns: injectionPatterns.filter(pattern => pattern.test(requestString))
            });
        }
        
        return originalJson.call(this, data);
    };
    
    // Log audit trail for sensitive operations
    const sensitivePaths = ['/admin', '/wallet', '/auth/register', '/service/create'];
    if (sensitivePaths.some(path => req.path.includes(path))) {
        logSecurityEvent('AUDIT_EVENT', req, {
            operation: req.method,
            resource: req.path
        });
    }
    
    next();
};

// Get security statistics
const getSecurityStats = () => {
    try {
        if (!fs.existsSync(SECURITY_LOG)) {
            return { totalEvents: 0, eventsByType: {}, topIPs: [] };
        }
        
        const logs = fs.readFileSync(SECURITY_LOG, 'utf8').split('\n').filter(line => line.trim());
        const events = logs.map(line => JSON.parse(line));
        
        const eventsByType = {};
        const ipCounts = {};
        const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
        
        events.forEach(event => {
            const eventTime = new Date(event.timestamp).getTime();
            if (eventTime > last24Hours) {
                eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
                ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
            }
        });
        
        const topIPs = Object.entries(ipCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count }));
        
        return {
            totalEvents: events.filter(e => new Date(e.timestamp).getTime() > last24Hours).length,
            eventsByType,
            topIPs,
            activeIPs: suspiciousIPs.size
        };
    } catch (error) {
        console.error('Error getting security stats:', error);
        return { totalEvents: 0, eventsByType: {}, topIPs: [] };
    }
};

// Security audit report generator
const generateAuditReport = () => {
    const stats = getSecurityStats();
    const report = `
=== F-SERVICE SECURITY AUDIT REPORT ===
Generated: ${new Date().toISOString()}

SUMMARY (Last 24 Hours):
- Total Security Events: ${stats.totalEvents}
- Active Suspicious IPs: ${stats.activeIPs}

EVENTS BY TYPE:
${Object.entries(stats.eventsByType).map(([type, count]) => 
    `- ${type}: ${count}`
).join('\n')}

TOP SUSPICIOUS IPs:
${stats.topIPs.map(({ ip, count }) => 
    `- ${ip}: ${count} events`
).join('\n')}

RECOMMENDATIONS:
${stats.totalEvents > 100 ? '- HIGH ACTIVITY: Consider increasing monitoring' : ''}
${stats.topIPs.length > 0 ? '- SUSPICIOUS ACTIVITY DETECTED: Review IP logs' : ''}
${stats.eventsByType[SECURITY_EVENTS.INJECTION_ATTEMPT] > 0 ? '- INJECTION ATTEMPTS: Implement additional WAF rules' : ''}
${stats.eventsByType[SECURITY_EVENTS.BRUTE_FORCE] > 0 ? '- BRUTE FORCE: Consider IP blocking' : ''}

========================================
`;
    
    const reportPath = path.join(LOG_DIR, `audit-report-${new Date().toISOString().split('T')[0]}.txt`);
    fs.writeFileSync(reportPath, report);
    
    return reportPath;
};

module.exports = {
    securityMonitor,
    logSecurityEvent,
    getSecurityStats,
    generateAuditReport,
    SECURITY_EVENTS
};
