// models/DichVu.js (Không thay đổi nhiều, logic ổn)

const mongoose = require('mongoose');

const DichVuSchema = new mongoose.Schema({
    TenDichVu: { 
        type: String, 
        required: [true, 'Tên dịch vụ là bắt buộc'],
        trim: true
    },
    LinhVuc: {
        type: String,
        required: [true, 'Lĩnh vực dịch vụ là bắt buộc'],
        trim: true
    },
    DonVi: {
        type: String,
        enum: ['VND', 'giờ', 'buổi', 'lần'],
        default: 'VND'
    },
    MoTa: { 
        type: String,
        trim: true
    },
    NguoiDung: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ThanhVien: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        default: null
    },
    TrangThai: {
        type: String,
        enum: ['cho-duyet', 'da-duyet', 'dang-thuc-hien', 'cho-xac-nhan-hoan-thanh', 'cho-duyet-hoan-thanh', 'da-nhan', 'dang-xu-ly', 'hoan-thanh', 'huy-bo'],
        default: 'cho-duyet'
    },
    Gia: {
        type: Number,
        required: [true, 'Giá dịch vụ là bắt buộc'],
        min: [0, 'Giá không được âm']
    },
    GiaAI: {
        type: Number,
        min: [0, 'Giá AI không được âm'],
        default: 0
    },
    ThoiGianHoanThanh: {
        type: Date
    },
    DanhGia: {
        Sao: {
            type: Number,
            min: 1,
            max: 5
        },
        NhanXet: String
    },
    // User confirmation fields
    UserDaXacNhan: {
        type: Boolean,
        default: false
    },
    NgayUserXacNhan: {
        type: Date
    },
    // Escrow transaction reference
    GiaoDichKyQuy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GiaoDich',
        default: null
    },
    // Member completion details
    ThanhVienHoanThanh: {
        ngayHoanThanh: {
            type: Date,
            default: null
        },
        danhGia: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        ghiChu: {
            type: String,
            default: ''
        },
        thanhVienId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            default: null
        }
    }
}, {
    timestamps: true,
    // Disable transactions for this model to avoid MongoDB replica set issues
    collection: 'dichvus'
});

module.exports = mongoose.model('DichVu', DichVuSchema);