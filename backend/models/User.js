const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên không được để trống'],
        trim: true,
        minlength: [2, 'Tên phải có ít nhất 2 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email không được để trống'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: 'Email không hợp lệ'
        }
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu không được để trống'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'member', 'admin'],
            message: 'Role không hợp lệ'
        },
        default: 'user'
    },
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'banned'],
            message: 'Trạng thái không hợp lệ'
        },
        default: 'active'
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    address: {
        type: String,
        trim: true,
        default: ''
    },
    avatar: {
        type: String,
        default: ''
    },
    soDu: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // Liên kết với Ví giao dịch (ViGiaoDich Model)
    ViGiaoDich: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ViGiaoDich',
        required: false, // Được gán sau khi user được tạo
    },
}, { timestamps: true });

// Middleware PRE-SAVE: Băm mật khẩu trước khi lưu
UserSchema.pre('save', async function(next) {
    // Chỉ băm mật khẩu nếu nó đã được thay đổi (hoặc là mới) VÀ chưa được băm
    if (!this.isModified('password')) {
        return next();
    }
    
    // Kiểm tra nếu password đã được băm (bắt đầu với $2a$, $2b$)
    if (this.password.startsWith('$2')) {
        console.log('🔑 Password already hashed, skipping...');
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('🔑 Password hashed successfully');
        next();
    } catch (error) {
        console.error('❌ Password hashing error:', error);
        next(error);
    }
});

// Method: So sánh mật khẩu (Sẽ dùng trong authController.js)
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // So sánh mật khẩu đầu vào với password đã băm trong DB
    // Vì password có `select: false`, ta cần đảm bảo fetch nó trước khi gọi method này (thường không cần trong logic login)
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);