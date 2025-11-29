// models/Member.js (Updated version)

const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
    UserId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
    },
    Ten: { type: String, required: true },
    Email: { type: String, required: true }, // Add email field
    SoDienThoai: { type: String, default: '' }, // Add phone field
    DiaChi: { type: String, default: '' }, // Add address field
    CapBac: { 
        type: String, 
        enum: ['Intern', 'Thành thạo', 'Chuyên gia'], 
        required: true 
    },
    LinhVuc: { type: String, required: true },
    MoTa: { type: String, default: '' }, // Add description field
    KinhNghiem: { type: String, default: '' }, // Add experience field
    KyNang: { type: [String], default: [] },
    ChungChi: { type: [String], default: [] },
    TrangThai: { 
        type: String, 
        enum: ['active', 'inactive', 'pending', 'approved', 'rejected', 'interview-scheduled'], 
        default: 'pending' 
    },
    DiemDanhGiaTB: { type: Number, default: 0 },
    DiemExp: { type: Number, default:0 }, // Experience points
    SoUyThacHoanThanh: { type: Number, default: 0 }, // Completed commissions count
    TongDoanhThu: { type: Number, default: 0 }, // Total revenue from commissions
    
    // Verification token for email confirmation
    verificationToken: { type: String, default: '' },
    
    // Interview details
    interviewDetails: {
        type: {
            type: String, // 'email', 'phone', 'video', 'in-person'
            default: 'email'
        },
        date: { type: Date },
        time: { type: String },
        location: { type: String },
        meetingLink: { type: String },
        message: { type: String },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        requestedAt: { type: Date, default: Date.now }
    },
    
    // Approval details
    approvalDetails: {
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date },
        notes: { type: String },
        probationPeriod: { type: Number, default: 30 }, // days
        specialInstructions: { type: String }
    },
    
    // Rejection details
    rejectionDetails: {
        reason: { type: String },
        category: { type: String }, // 'incomplete-profile', 'not-qualified', 'duplicate', 'other'
        feedback: { type: String },
        canReapply: { type: Boolean, default: false },
        rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rejectedAt: { type: Date, default: Date.now }
    },
    
    // Liên kết với ví giao dịch - cho phép member có ví riêng
    ViGiaoDich: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ViGiaoDich',
        required: false
    },
    
    NgayTao: { type: Date, default: Date.now },
    NgayCapNhat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Member', MemberSchema);