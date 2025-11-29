// backend/controllers/authController.js - API version
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const User = require('../models/User');
const imageProcessor = require('../utils/imageProcessor');
const logger = require('../config/logger');
const ViGiaoDich = require('../models/ViGiaoDich');
const Member = require('../models/Member');
const { 
  sanitizeInput, 
  checkAccountLockout, 
  recordFailedAttempt,
  validatePassword,
  generateSecureToken,
  setSecurityHeaders,
  securityAuditLog
} = require('../utils/securityUtils');
const { 
  handleValidationErrors,
  authValidations 
} = require('../middleware/validationMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'), false);
    }
  }
});

// @desc    Handle social login
// @route   POST /api/auth/social-login
// @access  Public
exports.socialLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { provider, user: socialUser, token: accessToken } = req.body;

    // Validate provider
    if (!['google', 'facebook'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported social login provider'
      });
    }

    // Find or create user
    let user = await User.findOne({
      $or: [
        { email: socialUser.email },
        { [`socialProfiles.${provider}.id`]: socialUser.id }
      ]
    });

    if (!user) {
      // Create new user from social login
      user = new User({
        name: sanitizeInput(socialUser.name),
        email: sanitizeInput(socialUser.email),
        password: crypto.randomBytes(32).toString('hex'), // Random password for social users
        role: 'user',
        status: 'active',
        isSocialUser: true,
        emailVerified: socialUser.verified || false,
        socialProfiles: {
          [provider]: {
            id: socialUser.id,
            email: socialUser.email,
            name: socialUser.name,
            avatar: socialUser.avatar,
            accessToken: accessToken,
            lastLogin: new Date()
          }
        }
      });

      await user.save();

      // Create wallet for new user
      try {
        const wallet = new ViGiaoDich({
          LoaiVi: 'User',
          ChuSoHuu: user._id,
          SoDuHienTai: 0,
          GiaoDich: []
        });
        
        await wallet.save();

        // Link wallet to user
        user.ViGiaoDich = wallet._id;
        await user.save();
      } catch (walletError) {
        console.error('Error creating wallet for social user:', walletError);
      }
    } else {
      // Update existing user's social profile
      if (!user.socialProfiles) {
        user.socialProfiles = {};
      }
      
      user.socialProfiles[provider] = {
        id: socialUser.id,
        email: socialUser.email,
        name: socialUser.name,
        avatar: socialUser.avatar,
        accessToken: accessToken,
        lastLogin: new Date()
      };

      // Update avatar if user doesn't have one
      if (!user.avatar && socialUser.avatar) {
        user.avatar = socialUser.avatar;
      }

      // Update email verification status
      if (socialUser.verified && !user.emailVerified) {
        user.emailVerified = true;
      }

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
      { 
        expiresIn: '7d',
        algorithm: 'HS256',
        issuer: 'f-service-api',
        audience: 'f-service-client'
      }
    );

    // Set security headers
    setSecurityHeaders(res);

    res.json({
      success: true,
      message: 'Đăng nhập bằng mạng xã hội thành công',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        provider: provider
      }
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng nhập bằng mạng xã hội thất bại',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Link social account to existing user
// @route   POST /api/auth/link-social
// @access  Private
exports.linkSocialAccount = async (req, res) => {
  try {
    const { provider, socialUser, accessToken } = req.body;

    if (!['google', 'facebook'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported social login provider'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if social account is already linked to another user
    const existingUser = await User.findOne({
      [`socialProfiles.${provider}.id`]: socialUser.id,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản mạng xã hội này đã được liên kết với người dùng khác'
      });
    }

    // Link social account
    if (!user.socialProfiles) {
      user.socialProfiles = {};
    }

    user.socialProfiles[provider] = {
      id: socialUser.id,
      email: socialUser.email,
      name: socialUser.name,
      avatar: socialUser.avatar,
      accessToken: accessToken,
      linkedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Liên kết tài khoản mạng xã hội thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        socialProfiles: user.socialProfiles
      }
    });

  } catch (error) {
    console.error('Link social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Liên kết tài khoản mạng xã hội thất bại'
    });
  }
};

// @desc    Unlink social account
// @route   DELETE /api/auth/unlink-social/:provider
// @access  Private
exports.unlinkSocialAccount = async (req, res) => {
  try {
    const { provider } = req.params;

    if (!['google', 'facebook'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported social login provider'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has password (required for unlinking social account)
    if (!user.password || user.isSocialUser) {
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy liên kết tài khoản mạng xã hội. Vui lòng đặt mật khẩu cho tài khoản của bạn.'
      });
    }

    // Unlink social account
    if (user.socialProfiles && user.socialProfiles[provider]) {
      delete user.socialProfiles[provider];
      await user.save();
    }

    res.json({
      success: true,
      message: 'Hủy liên kết tài khoản mạng xã hội thành công'
    });

  } catch (error) {
    console.error('Unlink social account error:', error);
    res.status(500).json({
      success: false,
      message: 'Hủy liên kết tài khoản mạng xã hội thất bại'
    });
  }
};

// @desc    Get user's social profiles
// @route   GET /api/auth/social-profiles
// @access  Private
exports.getSocialProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('socialProfiles');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        socialProfiles: user.socialProfiles || {}
      }
    });

  } catch (error) {
    console.error('Get social profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin tài khoản mạng xã hội'
    });
  }
};

// Registration validation middleware
const registerValidation = [
  body('name')
    .notEmpty().withMessage('Tên không được để trống')
    .trim()
    .isLength({ min: 2 }).withMessage('Tên phải có ít nhất 2 ký tự'),
  body('email')
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .custom((value) => {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }
      return true;
    }),
  body('password2')
    .notEmpty().withMessage('Vui lòng xác nhận mật khẩu')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    })
];

// Login validation middleware
const loginValidation = [
  body('email')
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Mật khẩu không được để trống')
    .custom((value) => {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }
      return true;
    })
];

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = [
  ...authValidations.register,
  handleValidationErrors,
  async (req, res) => {
    try {

      const { name, email, password } = req.body;

      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);

      // Enhanced email validation
      // const emailValidation = validateEmail(sanitizedEmail);
      // if (!emailValidation.isValid) {
      //   return res.status(400).json({
      //     success: false,
      //     message: emailValidation.error
      //   });
      // }

      // Check for existing user
      const existingUser = await User.findOne({ email: sanitizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng. Vui lòng chọn email khác.'
        });
      }

      // Create new user with enhanced password hashing
      const user = new User({
        name: sanitizedName,
        email: sanitizedEmail,
        password: password, // Will be hashed by User model pre-save hook
        role: 'user',
        status: 'active'
      });

      await user.save();

      // Create wallet for new user
      try {
        const wallet = new ViGiaoDich({
          LoaiVi: 'User',
          ChuSoHuu: user._id,
          SoDuHienTai: 0,
          GiaoDich: []
        });
        
        await wallet.save();

        // Link wallet to user
        user.ViGiaoDich = wallet._id;
        await user.save();
      } catch (walletError) {
        console.error('Error creating wallet:', walletError);
        // Continue even if wallet creation fails - user can still be created
        // Wallet can be created later if needed
      }

      // Generate token with enhanced security
      const token = jwt.sign(
        { 
          id: user._id, 
          role: user.role,
          email: user.email,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        { 
          expiresIn: '7d',
          algorithm: 'HS256',
          issuer: 'f-service-api',
          audience: 'f-service-client'
        }
      );

      // Set security headers
      setSecurityHeaders(res);

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error('Registration error:', err);
      // Return more detailed error message in development
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? (err.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.')
        : 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.';
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
      });
    }
  }
];

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = [
  ...authValidations.login,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Sanitize inputs first
      const sanitizedEmail = sanitizeInput(email);

      // Debug logging (limit in production)
      if (process.env.NODE_ENV === 'development') {
        logger.log('🔍 AuthController.login called');
        logger.log('📧 Email:', sanitizedEmail);
      }

      // Check account lockout status (tạm thời disable cho development)
      // const lockoutStatus = checkAccountLockout(sanitizedEmail);
      // if (lockoutStatus.isLocked) {
      //   return res.status(429).json({
      //     success: false,
      //     message: `Tài khoản đã bị khóa. Vui lòng thử lại sau ${Math.ceil(lockoutStatus.remainingTime / 60000)} phút.`,
      //     lockoutInfo: {
      //       isLocked: true,
      //       remainingTime: lockoutStatus.remainingTime,
      //       attempts: lockoutStatus.attempts
      //     }
      //   });
      // }

      // Debug logging (limit in production)
      if (process.env.NODE_ENV === 'development') {
        logger.log('🔍 Looking for user with email:', sanitizedEmail);
      }
      
      const user = await User.findOne({ email: sanitizedEmail }).select('+password');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 User lookup result:', !!user);
        if (user) {
          console.log('👤 User found:', user.name);
        }
      }

      if (!user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ User not found in database');
        }
        
        // For development: show available emails (remove in production)
        let availableEmails = [];
        if (process.env.NODE_ENV === 'development') {
          const allUsers = await User.find({});
          availableEmails = allUsers.map(u => u.email);
        }
        
        return res.status(401).json({
          success: false,
          message: 'Tài khoản không tồn tại trong hệ thống',
          suggestion: 'Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.',
          ...(process.env.NODE_ENV === 'development' && { availableEmails })
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Password comparison result:', isMatch);
      }
      
      if (!isMatch) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Password mismatch for user:', user.email);
        }
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu không đúng. Vui lòng kiểm tra lại.'
        });
      }

      // Clear failed attempts on successful login
      // clearFailedAttempts(sanitizedEmail);

      // Check if user is banned
      if (user.status === 'banned') {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa'
        });
      }

      // Create token with enhanced security
      const token = jwt.sign(
        { 
          id: user._id, 
          role: user.role,
          email: user.email,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
        { 
          expiresIn: '7d',
          algorithm: 'HS256',
          issuer: 'f-service-api',
          audience: 'f-service-client'
        }
      );

      // Set security headers
      setSecurityHeaders(res);

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? (err.message || 'Đã có lỗi xảy ra, vui lòng thử lại')
        : 'Đã có lỗi xảy ra, vui lòng thử lại';
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { error: err.stack })
      });
    }
  }
];

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // For API, we just return success
    // The client should remove the token
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi đăng xuất.'
    });
  }
};

// @desc    Get the current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('ViGiaoDich')
      .lean();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin người dùng.'
    });
  }
};
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = [
  upload.single('avatar'),
  ...authValidations.updateProfile,
  handleValidationErrors,
  async (req, res) => {

    try {
      const updateData = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.phone) updateData.phone = req.body.phone;
      if (req.body.address !== undefined) updateData.address = req.body.address;

      if (req.file) {
        // Xử lý và lưu avatar (tạm thời sử dụng đường dẫn trực tiếp)
        // const processedImage = await imageProcessor.processImage(req.file.path || req.file.pathName || req.file.filename);
        // updateData.avatar = processedImage.medium || processedImage.thumbnail || processedImage.large || processedImage;
        
        // Tạm thời sử dụng đường dẫn file trực tiếp
        const avatarPath = req.file.filename;
        updateData.avatar = `/uploads/${avatarPath}`;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công.',
        data: user
      });
    } catch (error) {
      console.error('Lỗi cập nhật profile:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi cập nhật thông tin.'
      });
    }
  }
];

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = [
  body('currentPassword').optional().notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc.'),
  body('oldPassword').optional().notEmpty().withMessage('Mật khẩu cũ là bắt buộc.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự.'),
  body('confirmPassword').optional().custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Xác nhận mật khẩu không khớp.');
    }
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const user = await User.findById(req.user._id).select('+password');

      // Support both currentPassword and oldPassword
      const oldPassword = req.body.currentPassword || req.body.oldPassword;
      
      if (!oldPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại là bắt buộc.'
        });
      }

      // Kiểm tra mật khẩu cũ
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng.'
        });
      }

      // Hash mật khẩu mới
      user.password = await bcrypt.hash(req.body.newPassword, 10);
      await user.save();

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công.'
      });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi đổi mật khẩu.'
      });
    }
  }
];

// @desc    Reset password request
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPasswordRequest = [
  body('email').isEmail().withMessage('Email không hợp lệ.'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.'
        });
      }

      // Tạo token reset password
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 giờ
      await user.save();

      // Gửi email reset password
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
      // await sendEmail({
      //   email: user.email,
      //   subject: 'Đặt lại mật khẩu',
      //   html: `
      //     <h1>Yêu cầu đặt lại mật khẩu</h1>
      //     <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới để tiếp tục:</p>
      //     <a href="${resetUrl}">Đặt lại mật khẩu</a>
      //     <p>Link này sẽ hết hạn sau 1 giờ.</p>
      //     <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      //   `
      // });
      console.log('Reset password URL (development):', resetUrl);

      res.json({
        success: true,
        message: 'Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.'
      });
    } catch (error) {
      console.error('Lỗi yêu cầu reset password:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi gửi email đặt lại mật khẩu.'
      });
    }
  }
];

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Xác nhận mật khẩu không khớp.');
    }
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'
        });
      }

      // Hash mật khẩu mới
      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Đặt lại mật khẩu thành công.'
      });
    } catch (error) {
      console.error('Lỗi reset password:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi đặt lại mật khẩu.'
      });
    }
  }
];
