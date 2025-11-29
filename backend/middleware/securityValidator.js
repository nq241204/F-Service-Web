// Security Validation Middleware
const { body, param, query, validationResult } = require('express-validator');

// Common validation patterns
const patterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  phone: /^[0-9+\-\s()]+$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  vietnamesePhone: /^(0|\+84)[3-9][0-9]{8}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d@$!%*?&()_+\-=\[\]{};':"\\|,.<>\/?]{12,}$/
};

// Custom validators
const validators = {
  // Email validation with domain check
  email: (domain) => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required')
    .custom((value) => {
      if (domain && !value.endsWith(domain)) {
        throw new Error(`Email must be from ${domain} domain`);
      }
      return true;
    }),
  
  // Password validation with configurable strength
  password: (strength = 'normal') => {
    let validator = body('password');
    
    switch (strength) {
      case 'strong':
        validator = validator
          .isLength({ min: 12 })
          .matches(patterns.strongPassword)
          .withMessage('Password must be at least 12 characters with uppercase, lowercase, number, and special character');
        break;
      case 'normal':
      default:
        validator = validator
          .isLength({ min: 8 })
          .matches(patterns.password)
          .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        break;
    }
    
    return validator
      .custom((value) => {
        // Check for common passwords
        const commonPasswords = [
          'password', '123456', 'qwerty', 'admin', 'letmein',
          'welcome', 'monkey', 'dragon', 'master', 'sunshine'
        ];
        
        if (commonPasswords.some(common => value.toLowerCase().includes(common))) {
          throw new Error('Password cannot contain common words');
        }
        
        // Check for sequential characters
        if (/(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(value)) {
          throw new Error('Password cannot contain sequential characters');
        }
        
        return true;
      });
  },
  
  // Phone validation with country support
  phone: (country = 'VN') => body('phone')
    .matches(country === 'VN' ? patterns.vietnamesePhone : patterns.phone)
    .withMessage(`Valid ${country} phone number is required`),
  
  // Name validation
  name: (field = 'name', minLength = 2, maxLength = 50) => body(field)
    .trim()
    .isLength({ min: minLength, max: maxLength })
    .matches(patterns.name)
    .withMessage(`${field} must be ${minLength}-${maxLength} characters long and contain only letters`),
  
  // Username validation
  username: body('username')
    .matches(patterns.username)
    .withMessage('Username must be 3-20 characters long and contain only letters, numbers, and underscores'),
  
  // ID validation (MongoDB ObjectId)
  objectId: (field = 'id') => param(field)
    .isMongoId()
    .withMessage(`Valid ${field} is required`),
  
  // Numeric validation
  numeric: (field, min = 0, max = Number.MAX_SAFE_INTEGER) => body(field)
    .isNumeric()
    .isInt({ min, max })
    .withMessage(`${field} must be a number between ${min} and ${max}`),
  
  // Amount validation (for payments)
  amount: (field = 'amount', min = 1000, max = 10000000) => body(field)
    .isNumeric()
    .isFloat({ min, max })
    .withMessage(`${field} must be between ${min} and ${max}`),
  
  // Date validation
  date: (field = 'date') => body(field)
    .isISO8601()
    .toDate()
    .withMessage(`Valid ${field} is required`),
  
  // URL validation
  url: (field = 'url') => body(field)
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage(`Valid ${field} is required`),
  
  // File validation
  file: (field = 'file', maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png']) => body(field)
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      
      if (req.file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      }
      
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`);
      }
      
      return true;
    }),
  
  // Array validation
  array: (field = 'items', minLength = 0, maxLength = 100) => body(field)
    .isArray({ min: minLength, max: maxLength })
    .withMessage(`${field} must be an array with ${minLength}-${maxLength} items`),
  
  // Boolean validation
  boolean: (field = 'active') => body(field)
    .isBoolean()
    .withMessage(`${field} must be true or false`),
  
  // Enum validation
  enum: (field = 'status', values = []) => body(field)
    .isIn(values)
    .withMessage(`${field} must be one of: ${values.join(', ')}`),
  
  // Required field validation
  required: (field = 'id') => body(field)
    .notEmpty()
    .withMessage(`${field} is required`),
  
  // Optional field validation
  optional: (field = 'description') => body(field)
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage(`${field} must be less than 500 characters`)
};

// Predefined validation sets
const validationSets = {
  // User registration
  register: [
    validators.name('name', 2, 50),
    validators.email(),
    validators.password('normal'),
    validators.phone('VN'),
    body('address')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must be less than 200 characters')
  ],
  
  // User login
  login: [
    validators.email(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  // Password reset
  resetPassword: [
    validators.email(),
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    validators.password('normal')
  ],
  
  // Change password
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    validators.password('normal')
  ],
  
  // Member registration
  memberRegister: [
    validators.objectId('userId'),
    validators.enum('memberType', ['Thực tập', 'Thành thạo', 'Chuyên gia']),
    validators.required('experience'),
    validators.required('skills'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters')
  ],
  
  // Admin approval
  adminApproval: [
    validators.objectId('userId'),
    validators.enum('action', ['approve', 'reject']),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters')
  ],
  
  // Payment transaction
  payment: [
    validators.amount('amount', 1000, 10000000),
    validators.enum('type', ['deposit', 'withdraw', 'transfer']),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters'),
    validators.required('userId')
  ],
  
  // Service request
  serviceRequest: [
    validators.objectId('serviceId'),
    validators.required('title'),
    validators.required('description'),
    validators.amount('budget', 50000, 50000000),
    validators.enum('priority', ['low', 'medium', 'high', 'urgent']),
    validators.date('deadline')
  ],
  
  // Profile update
  profileUpdate: [
    validators.name('name', 2, 50),
    validators.phone('VN'),
    body('address')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address must be less than 200 characters'),
    body('bio')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters')
  ],
  
  // Admin user management
  adminUserManagement: [
    validators.objectId('userId'),
    validators.enum('action', ['activate', 'deactivate', 'delete', 'updateRole']),
    validators.enum('role', ['user', 'member', 'admin'])
      .optional(),
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters')
  ],
  
  // File upload
  fileUpload: [
    validators.file('file', 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'application/pdf']),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters')
  ],
  
  // Search and filter
  search: [
    query('q')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Search query must be 2-100 characters'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isIn(['name', 'email', 'createdAt', 'updatedAt'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc')
  ]
};

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format errors for better client response
      const formattedErrors = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
        location: error.location
      }));
      
      // Log validation errors for security monitoring
      console.warn(`🚨 Validation Error: ${req.method} ${req.path}`, {
        errors: formattedErrors,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
        errorCount: formattedErrors.length
      });
    }
    
    next();
  };
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      }
    });
  }
  
  next();
};

module.exports = {
  validators,
  validationSets,
  validate,
  sanitize,
  patterns
};
