// models/UyThac.js (Phiên bản đã sửa)

const mongoose = require('mongoose');

const UyThacSchema = new mongoose.Schema({
    UserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    MemberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    DichVuId: { type: mongoose.Schema.Types.ObjectId, ref: 'DichVu', required: true },

    // Thông tin chi tiết
    TieuDe: { type: String, required: true },
    MoTaChiTiet: { type: String },
    DiaChi: { type: String },
    ThoiGianBatDau: { type: Date },
    ThoiGianKetThuc: { type: Date },
    
    // Giá cả
    GiaDuKien: { type: Number },
    GiaThoaThuan: { type: Number, required: true },
    PhiPhatSinh: { type: Number, default: 0 },
    
    // Trạng thái và tiến độ
    TrangThai: { 
        type: String, 
        enum: ['Moi', 'DaChuyenTienVaoHeThong', 'DangThucHien', 'ChoPheDuyetHoanThanh', 'DaHoanThanh', 'DaHuy'], 
        default: 'Moi' 
    },
    TienDo: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    
    // Ghi chú và lịch sử
    GhiChu: { type: String },
    LichSuCapNhat: [{
        HanhDong: { type: String },
        MoTa: { type: String },
        NguoiThucHien: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        ThoiGian: { type: Date, default: Date.now }
    }],
    
    // Đánh giá
    DanhGia: {
        Sao: { type: Number, min: 1, max: 5 },
        NhanXet: { type: String },
        NgayDanhGia: { type: Date }
    },

    NgayTao: { type: Date, default: Date.now },
    NgayCapNhat: { type: Date, default: Date.now }
});

// Middleware để tự động cập nhật NgayCapNhat
UyThacSchema.pre('save', function(next) {
    this.NgayCapNhat = Date.now();
    next();
});

module.exports = mongoose.model('UyThac', UyThacSchema);