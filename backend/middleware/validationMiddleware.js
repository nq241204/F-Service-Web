// backend/middleware/validationMiddleware.js - Unified Validation System
const { validationResult } = require('express-validator');

/**
 * Validation Error Handler Middleware
 * Sử dụng sau khi validation chain để xử lý errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => {
      // Map các lỗi sang tiếng Việt dễ hiểu
      let vietnameseMessage = error.msg;
      
      // Custom mapping cho các lỗi phổ biến
      if (error.msg.includes('Email không hợp lệ')) {
        vietnameseMessage = 'Email không đúng định dạng (ví dụ: user@example.com)';
      } else if (error.msg.includes('Mật khẩu phải có ít nhất')) {
        vietnameseMessage = 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số';
      } else if (error.msg.includes('Tên không được để trống')) {
        vietnameseMessage = 'Vui lòng nhập tên của bạn';
      } else if (error.msg.includes('Số điện thoại không hợp lệ')) {
        vietnameseMessage = 'Số điện thoại không đúng định dạng (ví dụ: 0901234567)';
      } else if (error.msg.includes('không được để trống')) {
        vietnameseMessage = `${error.path || 'Trường này'} không được để trống`;
      }
      
      return {
        field: error.path || error.param,
        message: vietnameseMessage,
        value: error.value
      };
    });
    
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các thông tin bên dưới.',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Common Validation Rules
 */
const commonValidations = {
  // Email validation
  email: () => [
    require('express-validator').body('email')
      .notEmpty()
      .withMessage('Email không được để trống')
      .isEmail()
      .withMessage('Email không hợp lệ')
      .normalizeEmail()
  ],
  
  // Password validation
  password: (required = true) => [
    require('express-validator').body('password')
      .if(() => required)
      .notEmpty()
      .withMessage('Mật khẩu không được để trống')
      .if(() => required)
      .isLength({ min: 6 })
      .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số')
  ],
  
  // Name validation
  name: (required = true) => [
    require('express-validator').body('name')
      .if(() => required)
      .notEmpty()
      .withMessage('Tên không được để trống')
      .if(() => required)
      .isLength({ min: 2, max: 50 })
      .withMessage('Tên phải có từ 2 đến 50 ký tự')
      .trim()
  ],
  
  // Phone validation
  phone: (required = false) => [
    require('express-validator').body('phone')
      .if((value) => required || value !== undefined)
      .notEmpty()
      .withMessage('Số điện thoại không được để trống')
      .if((value) => required || value !== undefined)
      .matches(/^(0[3-9][0-9]{8}|[+][0-9]{10,15})$/)
      .withMessage('Số điện thoại không hợp lệ')
      .optional()
  ],
  
  // Price validation
  price: (required = true) => [
    require('express-validator').body('price')
      .if(() => required)
      .notEmpty()
      .withMessage('Giá không được để trống')
      .isInt({ min: 0 })
      .withMessage('Giá phải là số không âm')
  ],
  
  // Address validation
  address: (required = false) => [
    require('express-validator').body('address')
      .if((value) => required)
      .notEmpty()
      .withMessage('Địa chỉ không được để trống')
      .if((value) => required || value !== undefined)
      .trim()
      .isLength({ max: 200 })
      .withMessage('Địa chỉ không được quá 200 ký tự')
  ],
  
  // MongoDB ID validation
  mongoId: (field = 'id') => [
    require('express-validator').body(field)
      .notEmpty()
      .withMessage(`${field} không được để trống`)
      .isMongoId()
      .withMessage(`${field} không hợp lệ`)
  ]
};

/**
 * Authentication Validation Rules
 */
const authValidations = {
  // Login validation
  login: [
    ...commonValidations.email(),
    require('express-validator').body('password')
      .notEmpty()
      .withMessage('Mật khẩu không được để trống')
  ],
  
  // Register validation
  register: [
    ...commonValidations.name(),
    ...commonValidations.email(),
    ...commonValidations.password(),
    require('express-validator').body('password2')
      .notEmpty()
      .withMessage('Xác nhận mật khẩu không được để trống')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        return true;
      }),
    ...commonValidations.phone(false),
    ...commonValidations.address(false)
  ],
  
  // Profile update validation
  updateProfile: [
    require('express-validator').body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Tên phải có từ 2 đến 50 ký tự')
      .trim(),
    ...commonValidations.phone(false),
    ...commonValidations.address(false),
    require('express-validator').body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio không được quá 500 ký tự')
      .trim()
  ],
  
  // Password change validation
  changePassword: [
    require('express-validator').body('currentPassword')
      .notEmpty()
      .withMessage('Mật khẩu hiện tại không được để trống'),
    ...commonValidations.password(),
    require('express-validator').body('confirmPassword')
      .notEmpty()
      .withMessage('Xác nhận mật khẩu mới không được để trống')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Mật khẩu xác nhận không khớp');
        }
        return true;
      })
  ]
};

/**
 * Service Validation Rules
 */
const serviceValidations = {
  create: [
    require('express-validator').body('title')
      .trim()
      .notEmpty()
      .withMessage('Tiêu đề dịch vụ là bắt buộc')
      .isLength({ min: 5, max: 100 })
      .withMessage('Tiêu đề phải có từ 5 đến 100 ký tự'),
    require('express-validator').body('description')
      .trim()
      .notEmpty()
      .withMessage('Mô tả dịch vụ là bắt buộc')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Mô tả phải có từ 10 đến 1000 ký tự'),
    ...commonValidations.price(),
    ...commonValidations.address(false),
    require('express-validator').body('serviceType')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Loại dịch vụ không được quá 50 ký tự'),
    require('express-validator').body('expectedDate')
      .optional()
      .isISO8601()
      .withMessage('Ngày mong muốn không hợp lệ')
  ],
  
  update: [
    require('express-validator').body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Tiêu đề phải có từ 5 đến 100 ký tự'),
    require('express-validator').body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Mô tả phải có từ 10 đến 1000 ký tự'),
    require('express-validator').body('price')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Giá phải là số không âm')
  ]
};

/**
 * Wallet/Transaction Validation Rules
 */
const walletValidations = {
  deposit: [
    require('express-validator').body('amount')
      .notEmpty()
      .withMessage('Số tiền không được để trống')
      .isNumeric()
      .withMessage('Số tiền phải là số')
      .isFloat({ min: 10000 })
      .withMessage('Số tiền tối thiểu là 10,000 VND'),
    require('express-validator').body('method')
      .notEmpty()
      .withMessage('Phương thức thanh toán không được để trống')
      .isIn(['transfer', 'qrcode'])
      .withMessage('Phương thức thanh toán không hợp lệ'),
    require('express-validator').body('provider')
      .notEmpty()
      .withMessage('Nhà cung cấp không được để trống')
      .isIn(['momo', 'zalopay', 'bank'])
      .withMessage('Nhà cung cấp không hợp lệ')
  ],
  
  withdraw: [
    ...commonValidations.price(),
    require('express-validator').body('bankAccount')
      .notEmpty()
      .withMessage('Thông tin tài khoản ngân hàng không được để trống')
      .isLength({ min: 10, max: 50 })
      .withMessage('Thông tin tài khoản ngân hàng không hợp lệ')
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidations,
  authValidations,
  serviceValidations,
  walletValidations
};
