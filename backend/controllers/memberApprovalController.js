// backend/controllers/memberApprovalController.js
const Member = require('../models/Member');
const User = require('../models/User');
const sendEmail = require('../utils/email');

// @desc    Get member details for approval
// @route   GET /api/admin/members/:id/approve
// @access  Private (Admin only)
exports.getMemberApprovalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const member = await Member.findById(id)
      .populate('UserId', 'name email phone status')
      .lean();
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member không tồn tại'
      });
    }

    res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('Get member approval details error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin member'
    });
  }
};

// @desc    Send interview request to member
// @route   POST /api/admin/members/:id/interview
// @access  Private (Admin only)
exports.sendInterviewRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      interviewType, // 'email' or 'phone'
      interviewDate,
      interviewTime,
      interviewLocation, // for in-person
      meetingLink, // for online
      message,
      contactInfo 
    } = req.body;

    const member = await Member.findById(id).populate('UserId');
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member không tồn tại'
      });
    }

    // Update member status to 'interview-scheduled'
    member.TrangThai = 'interview-scheduled';
    member.interviewDetails = {
      type: interviewType,
      date: interviewDate,
      time: interviewTime,
      location: interviewLocation,
      meetingLink: meetingLink,
      message: message,
      requestedBy: req.user._id,
      requestedAt: new Date()
    };
    await member.save();

    // Send interview request email
    const emailContent = `
      <h2>📅 Thư mời phỏng vấn - F-Service</h2>
      <p>Chào ${member.Ten},</p>
      <p>Cảm ơn bạn đã đăng ký trở thành thành viên của F-Service. Chúng tôi đã xem xét hồ sơ của bạn và muốn mời bạn tham gia buổi phỏng vấn.</p>
      
      <h3>📋 Thông tin phỏng vấn:</h3>
      <ul>
        <li><strong>Hình thức:</strong> ${interviewType === 'email' ? 'Trao đổi qua email' : 'Phỏng vấn trực tuyến/trực tiếp'}</li>
        <li><strong>Ngày:</strong> ${interviewDate}</li>
        <li><strong>Thời gian:</strong> ${interviewTime}</li>
        ${interviewLocation ? `<li><strong>Địa điểm:</strong> ${interviewLocation}</li>` : ''}
        ${meetingLink ? `<li><strong>Link họp:</strong> <a href="${meetingLink}">${meetingLink}</a></li>` : ''}
      </ul>
      
      ${message ? `
      <h3>📝 Ghi chú từ admin:</h3>
      <p>${message}</p>
      ` : ''}
      
      <h3>📞 Thông tin liên hệ:</h3>
      <p>Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ:</p>
      <ul>
        <li>Email: ${req.user.email}</li>
        ${contactInfo?.phone ? `<li>SĐT: ${contactInfo.phone}</li>` : ''}
        ${contactInfo?.additional ? `<li>Thông tin khác: ${contactInfo.additional}</li>` : ''}
      </ul>
      
      <h3>📄 Chuẩn bị cho phỏng vấn:</h3>
      <ul>
        <li>CV/Portfolio (nếu có)</li>
        <li>Chứng chỉ liên quan (nếu có)</li>
        <li>Mô tả các dự án đã thực hiện</li>
        <li>Câu hỏi về kinh nghiệm và kỹ năng</li>
      </ul>
      
      <p>Vui lòng xác nhận tham gia bằng cách trả lời email này.</p>
      
      <p>Trân trọng,<br>
      Đội ngũ F-Service</p>
      
      <hr>
      <p><small>Email này được gửi tự động từ hệ thống F-Service</small></p>
    `;

    try {
      await sendEmail({
        to: member.UserId.email,
        subject: `F-Service - Thư mời phỏng vấn (${interviewType})`,
        html: emailContent
      });
    } catch (emailError) {
      console.error('Error sending interview email:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'Đã gửi thư mời phỏng vấn thành công',
      data: {
        interviewDetails: member.interviewDetails
      }
    });

  } catch (error) {
    console.error('Send interview request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi thư mời phỏng vấn'
    });
  }
};

// @desc    Approve member after interview
// @route   POST /api/admin/members/:id/final-approve
// @access  Private (Admin only)
exports.finalApproveMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      approvalNotes,
      assignedCapBac, // Can be different from original request
      probationPeriod, // in days
      specialInstructions 
    } = req.body;

    const member = await Member.findById(id).populate('UserId');
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member không tồn tại'
      });
    }

    // Update member status to active
    member.TrangThai = 'active';
    member.CapBac = assignedCapBac || member.CapBac;
    member.approvalDetails = {
      approvedBy: req.user._id,
      approvedAt: new Date(),
      notes: approvalNotes,
      probationPeriod: probationPeriod || 30,
      specialInstructions: specialInstructions
    };
    await member.save();

    // Update user status and role
    const user = member.UserId;
    user.status = 'active';
    user.role = 'member';
    await user.save();

    // Send approval email
    const emailContent = `
      <h2>🎉 Chúc mừng! Bạn đã được phê duyệt - F-Service</h2>
      <p>Chào ${member.Ten},</p>
      <p>Sau buổi phỏng vấn, chúng tôi rất vui mừng thông báo rằng bạn đã chính thức được phê duyệt trở thành thành viên của F-Service.</p>
      
      <h3>📋 Thông tin phê duyệt:</h3>
      <ul>
        <li><strong>Cấp bậc:</strong> ${member.CapBac}</li>
        <li><strong>Lĩnh vực:</strong> ${member.LinhVuc}</li>
        <li><strong>Ngày phê duyệt:</strong> ${new Date().toLocaleDateString('vi-VN')}</li>
        <li><strong>Thời gian thử việc:</strong> ${probationPeriod || 30} ngày</li>
      </ul>
      
      ${approvalNotes ? `
      <h3>📝 Ghi chú từ admin:</h3>
      <p>${approvalNotes}</p>
      ` : ''}
      
      ${specialInstructions ? `
      <h3>📋 Hướng dẫn đặc biệt:</h3>
      <p>${specialInstructions}</p>
      ` : ''}
      
      <h3>🚀 Các bước tiếp theo:</h3>
      <ol>
        <li>Đăng nhập vào tài khoản của bạn trên F-Service</li>
        <li>Hoàn thành profile và thêm kỹ năng/chứng chỉ</li>
        <li>Bắt đầu nhận yêu cầu dịch vụ phù hợp</li>
        <li>Tham gia cộng đồng thành viên để nhận hỗ trợ</li>
      </ol>
      
      <h3>💡 Lưu ý quan trọng:</h3>
      <ul>
        <li>Trong thời gian thử việc, hãy hoàn thành tốt các yêu cầu đầu tiên</li>
        <gi>Duy trì đánh giá cao để nhận được nhiều yêu cầu hơn</li>
        <li>Luôn tuân thủ quy tắc và tiêu chuẩn của F-Service</li>
        <li>Liên hệ support nếu cần hỗ trợ kỹ thuật</li>
      </ul>
      
      <p>Cảm ơn bạn đã gia nhập đội ngũ F-Service!</p>
      
      <p>Trân trọng,<br>
      Đội ngũ F-Service</p>
      
      <hr>
      <p><small>Email này được gửi tự động từ hệ thống F-Service</small></p>
    `;

    try {
      await sendEmail({
        to: member.UserId.email,
        subject: '🎉 Chúc mừng! Bạn đã được phê duyệt thành viên F-Service',
        html: emailContent
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'Đã phê duyệt thành viên thành công',
      data: {
        member: member,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Final approve member error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phê duyệt thành viên'
    });
  }
};

// @desc    Reject member with reason
// @route   POST /api/admin/members/:id/reject
// @access  Private (Admin only)
exports.rejectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      rejectionReason,
      rejectionCategory, // 'incomplete-profile', 'not-qualified', 'duplicate', 'other'
      feedback,
      canReapply // boolean - can they apply again later
    } = req.body;

    const member = await Member.findById(id).populate('UserId');
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member không tồn tại'
      });
    }

    // Update member status to rejected
    member.TrangThai = 'rejected';
    member.rejectionDetails = {
      reason: rejectionReason,
      category: rejectionCategory,
      feedback: feedback,
      canReapply: canReapply || false,
      rejectedBy: req.user._id,
      rejectedAt: new Date()
    };
    await member.save();

    // Update user status to inactive
    const user = member.UserId;
    user.status = 'inactive';
    await user.save();

    // Send rejection email
    const emailContent = `
      <h2>❌ Thông báo về kết quả đăng ký - F-Service</h2>
      <p>Chào ${member.Ten},</p>
      <p>Cảm ơn bạn đã quan tâm và đăng ký trở thành thành viên của F-Service.</p>
      
      <p>Sau khi xem xét hồ sơ và/hoặc phỏng vấn, chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn chưa được chấp nhận vào lúc này.</p>
      
      <h3>📋 Lý do:</h3>
      <p><strong>${rejectionCategory === 'incomplete-profile' ? 'Hồ sơ chưa đầy đủ' :
                 rejectionCategory === 'not-qualified' ? 'Chưa đáp ứng yêu cầu' :
                 rejectionCategory === 'duplicate' ? 'Đăng ký trùng lặp' :
                 'Lý do khác'}</strong></p>
      
      <p>${rejectionReason}</p>
      
      ${feedback ? `
      <h3>💬 Góp ý để cải thiện:</h3>
      <p>${feedback}</p>
      ` : ''}
      
      ${canReapply ? `
      <h3>🔄 Về việc đăng ký lại:</h3>
      <p>Bạn có thể đăng ký lại sau khi cải thiện các điểm đã nêu. Thời gian đề nghị: 3-6 tháng.</p>
      ` : `
      <h3>📝 Về việc đăng ký lại:</h3>
      <p>Hiện tại chúng tôi chưa thể nhận thêm đơn đăng ký từ bạn. Cảm ơn sự thấu hiểu của bạn.</p>
      `}
      
      <h3>🤝 Cảm ơn:</h3>
      <p>Chúng tôi rất trân trọng sự quan tâm của bạn đối với F-Service và chúc bạn may mắn trong con đường sự nghiệp của mình.</p>
      
      <p>Trân trọng,<br>
      Đội ngũ F-Service</p>
      
      <hr>
      <p><small>Email này được gửi tự động từ hệ thống F-Service</small></p>
    `;

    try {
      await sendEmail({
        to: member.UserId.email,
        subject: 'Thông báo về kết quả đăng ký thành viên F-Service',
        html: emailContent
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'Đã từ chối thành viên',
      data: {
        member: member,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      }
    });

  } catch (error) {
    console.error('Reject member error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối thành viên'
    });
  }
};
