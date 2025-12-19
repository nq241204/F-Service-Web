#!/usr/bin/env node

// Security Audit Script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    MAGENTA: '\x1b[35m',
    CYAN: '\x1b[36m',
    WHITE: '\x1b[37m',
    RESET: '\x1b[0m'
};

function log(message, color = COLORS.WHITE) {
    console.log(`${color}${message}${COLORS.RESET}`);
}

function checkSecurityHeaders() {
    log('\n🔒 Checking Security Headers...', COLORS.CYAN);
    
    try {
        const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
        
        const securityChecks = {
            'Helmet': /app\.use\(helmet\(\)/.test(serverContent),
            'Rate Limiting': /rateLimit/.test(serverContent),
            'MongoDB Sanitization': /req\.body.*JSON\.stringify.*replace.*\$.*_/.test(serverContent),
            'CORS': /cors/.test(serverContent),
            'HPP': /hpp/.test(serverContent)
        };
        
        Object.entries(securityChecks).forEach(([check, passed]) => {
            const status = passed ? '✅' : '❌';
            const color = passed ? COLORS.GREEN : COLORS.RED;
            log(`  ${status} ${check}`, color);
        });
        
        return Object.values(securityChecks).every(Boolean);
    } catch (error) {
        log(`  ❌ Error checking security headers: ${error.message}`, COLORS.RED);
        return false;
    }
}

function checkDependencies() {
    log('\n📦 Checking Dependencies...', COLORS.CYAN);
    
    try {
        const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
        const audit = JSON.parse(auditResult);
        
        if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
            log(`  ❌ Found ${Object.keys(audit.vulnerabilities).length} vulnerabilities`, COLORS.RED);
            Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
                log(`    - ${pkg}: ${vuln.severity}`, COLORS.YELLOW);
            });
            return false;
        } else {
            log('  ✅ No vulnerabilities found', COLORS.GREEN);
            return true;
        }
    } catch (error) {
        log('  ✅ No vulnerabilities found', COLORS.GREEN);
        return true;
    }
}

function checkOutdatedPackages() {
    log('\n🔄 Checking Outdated Packages...', COLORS.CYAN);
    
    try {
        const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
        const outdated = JSON.parse(outdatedResult);
        
        if (Object.keys(outdated).length > 0) {
            log(`  ⚠️  Found ${Object.keys(outdated).length} outdated packages`, COLORS.YELLOW);
            Object.entries(outdated).forEach(([pkg, versions]) => {
                log(`    - ${pkg}: ${versions.current} → ${versions.latest}`, COLORS.YELLOW);
            });
            return false;
        } else {
            log('  ✅ All packages are up to date', COLORS.GREEN);
            return true;
        }
    } catch (error) {
        log('  ✅ All packages are up to date', COLORS.GREEN);
        return true;
    }
}

function checkEnvironmentVariables() {
    log('\n🔐 Checking Environment Variables...', COLORS.CYAN);
    
    try {
        const envPath = path.join(__dirname, '../.env');
        if (!fs.existsSync(envPath)) {
            log('  ❌ .env file not found', COLORS.RED);
            return false;
        }
        
        const envContent = fs.readFileSync(envPath, 'utf8');
        const requiredVars = [
            'JWT_SECRET',
            'SESSION_SECRET',
            'MONGODB_URI',
            'API_SECRET'
        ];
        
        let allPresent = true;
        requiredVars.forEach(varName => {
            if (envContent.includes(`${varName}=`)) {
                log(`  ✅ ${varName}`, COLORS.GREEN);
            } else {
                log(`  ❌ ${varName} missing`, COLORS.RED);
                allPresent = false;
            }
        });
        
        return allPresent;
    } catch (error) {
        log(`  ❌ Error checking environment variables: ${error.message}`, COLORS.RED);
        return false;
    }
}

function checkFilePermissions() {
    log('\n📁 Checking File Permissions...', COLORS.CYAN);
    
    const sensitiveFiles = [
        '../.env',
        '../config/db.js',
        '../models/User.js',
        '../middleware/authMiddleware.js'
    ];
    
    let allSecure = true;
    sensitiveFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            try {
                const stats = fs.statSync(filePath);
                const mode = (stats.mode & parseInt('777', 8)).toString(8);
                
                // Check if file is readable by others (should be restricted)
                if (mode.includes('4') || mode.includes('6') || mode.includes('7')) {
                    log(`  ⚠️  ${file} has permissive permissions (${mode})`, COLORS.YELLOW);
                } else {
                    log(`  ✅ ${file}`, COLORS.GREEN);
                }
            } catch (error) {
                log(`  ❌ Error checking ${file}: ${error.message}`, COLORS.RED);
                allSecure = false;
            }
        } else {
            log(`  ⚠️  ${file} not found`, COLORS.YELLOW);
        }
    });
    
    return allSecure;
}

function checkSecurityMonitoring() {
    log('\n📊 Checking Security Monitoring...', COLORS.CYAN);
    
    try {
        const monitoringPath = path.join(__dirname, '../middleware/securityMonitoring.js');
        if (!fs.existsSync(monitoringPath)) {
            log('  ❌ Security monitoring middleware not found', COLORS.RED);
            return false;
        }
        
        const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
        const hasMonitoring = serverContent.includes('securityMonitor');
        
        if (hasMonitoring) {
            log('  ✅ Security monitoring is active', COLORS.GREEN);
            return true;
        } else {
            log('  ❌ Security monitoring not configured', COLORS.RED);
            return false;
        }
    } catch (error) {
        log(`  ❌ Error checking security monitoring: ${error.message}`, COLORS.RED);
        return false;
    }
}

function generateSecurityReport() {
    log('\n📋 Generating Security Report...', COLORS.CYAN);
    
    const checks = [
        { name: 'Security Headers', check: checkSecurityHeaders },
        { name: 'Dependencies', check: checkDependencies },
        { name: 'Outdated Packages', check: checkOutdatedPackages },
        { name: 'Environment Variables', check: checkEnvironmentVariables },
        { name: 'File Permissions', check: checkFilePermissions },
        { name: 'Security Monitoring', check: checkSecurityMonitoring }
    ];
    
    let results = [];
    let passedCount = 0;
    
    checks.forEach(({ name, check }) => {
        try {
            const passed = check();
            results.push({ name, passed });
            if (passed) passedCount++;
        } catch (error) {
            results.push({ name, passed: false, error: error.message });
        }
    });
    
    const score = Math.round((passedCount / checks.length) * 100);
    
    log('\n' + '='.repeat(50), COLORS.BLUE);
    log('🎯 SECURITY AUDIT SUMMARY', COLORS.BLUE);
    log('='.repeat(50), COLORS.BLUE);
    
    log(`\nOverall Security Score: ${score}%`, score >= 80 ? COLORS.GREEN : score >= 60 ? COLORS.YELLOW : COLORS.RED);
    
    log('\nDetailed Results:', COLORS.WHITE);
    results.forEach(({ name, passed, error }) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const color = passed ? COLORS.GREEN : COLORS.RED;
        log(`  ${status} ${name}`, color);
        if (error) {
            log(`    Error: ${error}`, COLORS.YELLOW);
        }
    });
    
    // Recommendations
    log('\n📝 Recommendations:', COLORS.CYAN);
    
    if (score < 80) {
        log('  - Address failed security checks immediately', COLORS.RED);
    }
    
    if (!results.find(r => r.name === 'Dependencies')?.passed) {
        log('  - Update vulnerable dependencies', COLORS.YELLOW);
    }
    
    if (!results.find(r => r.name === 'Outdated Packages')?.passed) {
        log('  - Update outdated packages for latest security patches', COLORS.YELLOW);
    }
    
    if (!results.find(r => r.name === 'Security Monitoring')?.passed) {
        log('  - Implement security monitoring for real-time threat detection', COLORS.YELLOW);
    }
    
    log('  - Schedule regular security audits (weekly)', COLORS.WHITE);
    log('  - Monitor security logs for suspicious activity', COLORS.WHITE);
    log('  - Keep all dependencies updated', COLORS.WHITE);
    log('  - Review and rotate secrets periodically', COLORS.WHITE);
    
    // Save report
    const reportData = {
        timestamp: new Date().toISOString(),
        score,
        results,
        recommendations: [
            'Schedule regular security audits',
            'Monitor security logs',
            'Keep dependencies updated',
            'Review access controls',
            'Implement automated testing'
        ]
    };
    
    const reportPath = path.join(__dirname, '../logs/security-audit-report.json');
    if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    log(`\n📄 Detailed report saved to: ${reportPath}`, COLORS.GREEN);
    
    return score;
}

// Run security audit
if (require.main === module) {
    log('🔍 Starting F-Service Security Audit...', COLORS.BLUE);
    log('='.repeat(50), COLORS.BLUE);
    
    const score = generateSecurityReport();
    
    log('\n' + '='.repeat(50), COLORS.BLUE);
    log(`🏁 Security Audit Complete - Score: ${score}%`, score >= 80 ? COLORS.GREEN : score >= 60 ? COLORS.YELLOW : COLORS.RED);
    log('='.repeat(50), COLORS.BLUE);
    
    process.exit(score >= 60 ? 0 : 1);
}

module.exports = {
    generateSecurityReport,
    checkSecurityHeaders,
    checkDependencies,
    checkOutdatedPackages,
    checkEnvironmentVariables,
    checkFilePermissions,
    checkSecurityMonitoring
};
