# F-Service Validation System Documentation

## 📋 Overview

F-Service sử dụng hệ thống validation thống nhất dựa trên **express-validator** với middleware được thiết kế để:

- ✅ **Đảm bảo tính nhất quán** trên toàn bộ API endpoints
- ✅ **Cung cấp error messages** rõ ràng và chuẩn hóa
- ✅ **Tái sử dụng validation rules** trên nhiều routes
- ✅ **Easy maintenance** và scaling

## 🏗️ Architecture

### 1. **Validation Middleware** (`middleware/validationMiddleware.js`)

```javascript
const { 
  handleValidationErrors,
  authValidations,
  serviceValidations,
  walletValidations,
  commonValidations
} = require('./middleware/validationMiddleware');
```

### 2. **Error Handler**

```javascript
// Standard error response format
{
  success: false,
  message: 'Validation failed',
  errors: [
    {
      field: 'email',
      message: 'Email không hợp lệ',
      value: 'invalid-email'
    }
  ]
}
```

## 🔧 Validation Rules

### **Common Validations**

#### 📧 Email Validation
```javascript
...commonValidations.email()
// Rules: required, email format, normalized
```

#### 🔐 Password Validation
```javascript
...commonValidations.password(required = true)
// Rules: 6+ chars, 1 uppercase, 1 lowercase, 1 number
```

#### 👤 Name Validation
```javascript
...commonValidations.name(required = true)
// Rules: 2-50 chars, trimmed
```

#### 📱 Phone Validation
```javascript
...commonValidations.phone(required = false)
// Rules: Vietnamese format or international
// Pattern: 0[3-9][0-9]{8} or +[0-9]{10,15}
```

#### 💰 Price Validation
```javascript
...commonValidations.price(required = true)
// Rules: non-negative integer
```

#### 🏠 Address Validation
```javascript
...commonValidations.address(required = false)
// Rules: max 200 chars, trimmed
```

#### 🆔 MongoDB ID Validation
```javascript
...commonValidations.mongoId(field = 'id')
// Rules: valid MongoDB ObjectId format
```

### **Authentication Validations**

#### 🔑 Login Validation
```javascript
...authValidations.login
// Includes: email, password (required)
```

#### 📝 Register Validation
```javascript
...authValidations.register
// Includes: name, email, password, password2, phone, address
// Password confirmation check
```

#### 🔄 Profile Update Validation
```javascript
...authValidations.updateProfile
// Includes: optional name, phone, address, bio
```

#### 🔐 Password Change Validation
```javascript
...authValidations.changePassword
// Includes: currentPassword, password, confirmPassword
```

### **Service Validations**

#### 🌟 Service Creation
```javascript
...serviceValidations.create
// Includes: title (5-100 chars), description (10-1000 chars), price, address
```

#### ✏️ Service Update
```javascript
...serviceValidations.update
// Includes: optional title, description, price
```

### **Wallet Validations**

#### 💳 Deposit Validation
```javascript
...walletValidations.deposit
// Includes: price, paymentMethod (bank_transfer|qr_code|cash), transactionId
```

#### 💸 Withdraw Validation
```javascript
...walletValidations.withdraw
// Includes: price, bankAccount (10-50 chars)
```

## 🚀 Usage Examples

### **Basic Usage in Routes**

```javascript
const { authValidations, handleValidationErrors } = require('../middleware/validationMiddleware');

// Login endpoint
router.post('/login', [
  ...authValidations.login,
  handleValidationErrors
], authController.login);

// Register endpoint
router.post('/register', [
  ...authValidations.register,
  handleValidationErrors
], authController.register);
```

### **Custom Validation**

```javascript
// Add custom validation to existing rules
router.post('/custom', [
  ...authValidations.login,
  body('customField').isNumeric().withMessage('Must be number'),
  handleValidationErrors
], customController.handler);
```

### **Error Handling in Controllers**

```javascript
// No need for manual error checking!
// handleValidationErrors middleware handles it automatically

exports.login = async (req, res) => {
  // req.body is already validated here
  const { email, password } = req.body;
  // ... rest of logic
};
```

## 📁 File Structure

```
backend/
├── middleware/
│   └── validationMiddleware.js    # Main validation system
├── controllers/
│   ├── authController.js          # Updated with unified validation
│   └── ...
├── routes/
│   ├── auth.js                    # Updated with unified validation
│   ├── user.js                    # Updated with unified validation
│   ├── service.js                 # Updated with unified validation
│   └── wallet.js                  # Updated with unified validation
├── test/
│   └── validationTest.js          # Validation system tests
└── VALIDATION_SYSTEM.md          # This documentation
```

## 🧪 Testing

Run validation tests:

```bash
cd backend
node test/validationTest.js
```

**Test Coverage:**
- ✅ Login validation
- ✅ Register validation
- ✅ Service validation
- ✅ Wallet validation
- ✅ Common validation rules
- ✅ Error handling
- ✅ Response format standardization

## 🔄 Migration Status

### **Completed Migrations:**
- ✅ `authController.js` - Login, Register, Profile update
- ✅ `routes/auth.js` - Using unified validation
- ✅ `routes/user.js` - Service requests, Profile updates
- ✅ `routes/service.js` - Service creation/update
- ✅ `routes/wallet.js` - Deposit operations

### **Pending Migrations:**
- 🔄 `controllers/servicesController.js`
- 🔄 `controllers/transactionController.js`
- 🔄 `routes/admin.js`
- 🔄 Other custom validation endpoints

## 🎯 Benefits

### **Before (Inconsistent):**
```javascript
// Route 1
body('email').isEmail().withMessage('Email invalid'),

// Route 2  
body('email').notEmpty().withMessage('Email required'),

// Route 3
// No validation at all!
```

### **After (Unified):**
```javascript
// All routes
...commonValidations.email(),
// Consistent rules, messages, and error handling
```

### **Key Improvements:**
1. **🎯 Consistency**: Same validation rules across all endpoints
2. **🛡️ Security**: Comprehensive input sanitization and validation
3. **📝 Clarity**: Clear, Vietnamese error messages
4. **🔄 Maintainability**: Single source of truth for validation rules
5. **🧪 Testability**: Comprehensive test coverage
6. **📚 Documentation**: Clear usage examples and guidelines

## 🔮 Future Enhancements

- **🌐 Internationalization**: Multi-language error messages
- **📊 Validation Metrics**: Track validation failures and patterns
- **🔗 Conditional Validation**: More complex conditional rules
- **🎨 Custom Validators**: Business-specific validation rules
- **📱 API Documentation**: Auto-generated validation docs

## 🤝 Contributing

When adding new validation:

1. **Check existing rules** in `validationMiddleware.js`
2. **Add to common validations** if reusable
3. **Create specific validation** if unique
4. **Update tests** in `validationTest.js`
5. **Update documentation** in this file

## 📞 Support

For validation-related issues:
1. Check this documentation
2. Run validation tests
3. Review existing validation rules
4. Contact development team

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
