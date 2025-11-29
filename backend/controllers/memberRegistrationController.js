// backend/controllers/memberRegistrationController.js
const User = require('../models/User');
const Member = require('../models/Member');
const ViGiaoDich = require('../models/ViGiaoDich');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

// Member registration validation
const memberRegisterValidation = [
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
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('password2')
    .notEmpty().withMessage('Vui lòng xác nhận mật khẩu')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Mật khẩu xác nhận không khớp');
      }
      return true;
    }),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN').withMessage('Số điện thoại không hợp lệ'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 5 }).withMessage('Địa chỉ phải có ít nhất 5 ký tự'),
  body('CapBac')
    .notEmpty().withMessage('Vui lòng chọn cấp bậc')
    .isIn(['Intern', 'Thành thạo', 'Chuyên gia']).withMessage('Cấp bậc không hợp lệ'),
  body('LinhVuc')
    .notEmpty().withMessage('Vui lòng chọn lĩnh vực'),
  body('MoTa')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Mô tả không quá 500 ký tự'),
  body('KinhNghiem')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Kinh nghiệm không quá 1000 ký tự')
];

// @desc    Register new member (pending admin approval)
// @route   POST /api/auth/register-member
// @access  Public
exports.registerMember = [
  memberRegisterValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const {
        name,
        email,
        password,
        phone,
        address,
        CapBac,
        LinhVuc,
        MoTa,
        KinhNghiem
      } = req.body;

      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }

      // Check for existing member with same email
      const existingMember = await Member.findOne({ Email: email });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được đăng ký thành viên'
        });
      }

      // Create user account first (inactive until approved)
      const user = new User({
        name,
        email,
        password: password, // Will be hashed by User model pre-save hook
        role: 'member',
        status: 'inactive', // Inactive until admin approval
        phone: phone || '',
        address: address || ''
      });

      await user.save();

      // Create member profile (pending approval)
      const member = new Member({
        UserId: user._id,
        Ten: name,
        Email: email,
        SoDienThoai: phone || '',
        DiaChi: address || '',
        CapBac: CapBac,
        LinhVuc: LinhVuc,
        MoTa: MoTa || '',
        KinhNghiem: KinhNghiem || '',
        TrangThai: 'pending', // Pending admin approval
        NgayTao: new Date(),
        NgayCapNhat: new Date()
      });

      await member.save();

      // Link member to user
      user.memberProfile = member._id;
      await user.save();

      // Create wallet for member (inactive until approved)
      const wallet = new ViGiaoDich({
        LoaiVi: 'User',
        ChuSoHuu: user._id,
        SoDuHienTai: 0,
        GiaoDich: []
      });
      
      await wallet.save();
      user.ViGiaoDich = wallet._id;
      await user.save();

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Save verification token to member
      member.verificationToken = verificationToken;
      await member.save();

      // Send notification email to admin
      const adminUsers = await User.find({ role: 'admin', status: 'active' });
      
      if (adminUsers.length > 0) {
        const adminEmails = adminUsers.map(admin => admin.email);
        
        const adminEmailContent = `
          <h2>Yêu cầu đăng ký thành viên mới</h2>
          <p>Có một người dùng mới đăng ký trở thành thành viên và cần phê duyệt:</p>
          
          <h3>Thông tin thành viên:</h3>
          <ul>
            <li><strong>Họ tên:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Số điện thoại:</strong> ${phone || 'Chưa cung cấp'}</li>
            <li><strong>Địa chỉ:</strong> ${address || 'Chưa cung cấp'}</li>
            <li><strong>Cấp bậc:</strong> ${CapBac}</li>
            <li><strong>Lĩnh vực:</strong> ${LinhVuc}</li>
            <li><strong>Mô tả:</strong> ${MoTa || 'Chưa có'}</li>
            <li><strong>Kinh nghiệm:</strong> ${KinhNghiem || 'Chưa có'}</li>
            <li><strong>Ngày đăng ký:</strong> ${new Date().toLocaleString('vi-VN')}</li>
          </ul>
          
          <h3>Thao tác:</h3>
          <p>Vui lòng đăng nhập vào admin panel để phê duyệt hoặc từ chối yêu cầu này:</p>
          <p><a href="${process.env.FRONTEND_URL}/admin/members" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Quản lý thành viên</a></p>
          
          <hr>
          <p><small>Email này được gửi tự động từ hệ thống F-Service</small></p>
        `;

        try {
          await sendEmail({
            to: adminEmails,
            subject: 'F-Service - Yêu cầu đăng ký thành viên mới',
            html: adminEmailContent
          });
        } catch (emailError) {
          console.error('Error sending admin notification email:', emailError);
          // Continue even if email fails
        }
      }

      // Send confirmation email to member
      const memberEmailContent = `
        <h2>Cảm ơn bạn đã đăng ký thành viên F-Service!</h2>
        <p>Chào ${name},</p>
        <p>Cảm ơn bạn đã quan tâm và đăng ký trở thành thành viên của F-Service. Chúng tôi đã nhận được hồ sơ của bạn và sẽ xem xét trong thời gian sớm nhất.</p>
        
        <h3>Thông tin đăng ký:</h3>
        <ul>
          <li><strong>Họ tên:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Cấp bậc đăng ký:</strong> ${CapBac}</li>
          <li><strong>Lĩnh vực:</strong> ${LinhVuc}</li>
          <li><strong>Trạng thái:</strong> Chờ phê duyệt</li>
        </ul>
        
        <h3>Quy trình phê duyệt:</h3>
        <ol>
          <li><strong>Xem xét hồ sơ:</strong> Admin sẽ xem xét thông tin bạn cung cấp</li>
          <li><strong>Phỏng vấn:</strong> Chúng tôi sẽ liên hệ qua email để hẹn lịch phỏng vấn (nếu cần)</li>
          <li><strong>Nộp hồ sơ:</strong> Sau khi phỏng vấn, chúng tôi sẽ hướng dẫn nộp hồ sơ cần thiết</li>
          <li><strong>Phê duyệt cuối:</strong> Sau khi hoàn tất, tài khoản của bạn sẽ được kích hoạt</li>
        </ol>
        
        <h3>Lưu ý:</h3>
        <ul>
          <li>Quá trình phê duyệt có thể mất 3-5 ngày làm việc</li>
          <li>Chúng tôi sẽ liên hệ qua email để cập nhật tiến trình</li>
          <li>Vui lòng kiểm tra email thường xuyên (bao gồm cả spam/promotions)</li>
          <li>Bạn có thể theo dõi trạng thái đăng ký bằng cách đăng nhập vào tài khoản</li>
        </ul>
        
        <p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email này.</p>
        
        <p>Trân trọng,<br>
        Đội ngũ F-Service</p>
        
        <hr>
        <p><small>Email này được gửi tự động từ hệ thống F-Service</small></p>
      `;

      try {
        await sendEmail({
          to: email,
          subject: 'F-Service - Xác nhận đăng ký thành viên',
          html: memberEmailContent
        });
      } catch (emailError) {
        console.error('Error sending member confirmation email:', emailError);
        // Continue even if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành viên thành công! Vui lòng chờ admin phê duyệt. Chúng tôi sẽ liên hệ qua email để hướng dẫn các bước tiếp theo.',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
          },
          member: {
            id: member._id,
            status: member.TrangThai
          }
        }
      });

    } catch (error) {
      console.error('Member registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng ký thành viên'
      });
    }
  }
];

// @desc    Get member registration status
// @route   GET /api/auth/member-status/:userId
// @access  Public
exports.getMemberStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('memberProfile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    if (user.role !== 'member') {
      return res.status(400).json({
        success: false,
        message: 'Người dùng không phải là thành viên'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        },
        member: user.memberProfile ? {
          id: user.memberProfile._id,
          status: user.memberProfile.TrangThai,
          capBac: user.memberProfile.CapBac,
          linhVuc: user.memberProfile.LinhVuc,
          ngayTao: user.memberProfile.NgayTao
        } : null
      }
    });

  } catch (error) {
    console.error('Get member status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy trạng thái thành viên'
    });
  }
};

// @desc    Resend member registration confirmation
// @route   POST /api/auth/resend-member-confirmation
// @access  Public
exports.resendMemberConfirmation = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, role: 'member' }).populate('memberProfile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thành viên với email này'
      });
    }

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản đã được kích hoạt'
      });
    }

    // Resend confirmation email
    const memberEmailContent = `
      <h2>Gửi lại xác nhận đăng ký thành viên F-Service</h2>
      <p>Chào ${user.name},</p>
      <p>Bạn đã yêu cầu gửi lại email xác nhận đăng ký thành viên F-Service.</p>
      
      <h3>Thông tin đăng ký:</h3>
      <ul>
        <li><strong>Họ tên:</strong> ${user.name}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Trạng thái hiện tại:</strong> ${user.memberProfile?.TrangThai || 'Đang xử lý'}</li>
      </ul>
      
      <p>Chúng tôi đang xử lý hồ sơ của bạn và sẽ liên hệ sớm nhất có thể.</p>
      
      <p>Trân trọng,<br>
      Đội ngũ F-Service</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: 'F-Service - Gửi lại xác nhận đăng ký thành viên',
        html: memberEmailContent
      });
    } catch (emailError) {
      console.error('Error sending resend confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Email xác nhận đã được gửi lại'
    });

  } catch (error) {
    console.error('Resend confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi lại email xác nhận'
    });
  }
};
