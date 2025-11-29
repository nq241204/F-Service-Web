// GiaoDich.js (Transaction)
const mongoose = require('mongoose');

const GiaoDichSchema = new mongoose.Schema({
    Loai: {
        type: String,
        enum: ['deposit', 'withdraw', 'commission_payment', 'commission_fee', 'service_escrow', 'service_refund', 'payment', 'commission'], // Loại giao dịch
        required: true
    },
    SoTien: {
        type: Number,
        required: true,
        min: 1
    },
    NguoiThamGia: { // User/Member liên quan đến giao dịch
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    NguoiNhan: { // Người nhận tiền (cho giao dịch chuyển tiền, hoàn tiền)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    TrangThai: {
        type: String,
        enum: ['pending', 'success', 'failed', 'cancelled'],
        default: 'pending'
    },
    MoTa: {
        type: String,
        required: false
    },
    // Thông tin thanh toán (phương thức, chi tiết)
    ThongTinThanhToan: {
        type: Object,
        default: {}
    },
    
    NgayGiaoDich: {
        type: Date,
        default: Date.now
    },
    
    // Ngày giao dịch hoàn thành thành công
    NgayHoanThanh: {
        type: Date,
        default: null
    },
    
    // Ngày hủy giao dịch
    NgayHuy: {
        type: Date,
        default: null
    },
    
    // Lý do hủy giao dịch
    LyDoHuy: {
        type: String,
        default: null
    },

    // Trường hợp giao dịch liên quan đến một ủy thác cụ thể
    DichVu: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DichVu',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('GiaoDich', GiaoDichSchema, 'GiaoDich');