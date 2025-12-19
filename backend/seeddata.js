// seeddata.js - Tạo dữ liệu mẫu cho F-Service
const mongoose = require('mongoose');

// Import models
const User = require('./models/User');
const DichVu = require('./models/DichVu');
const GiaoDich = require('./models/GiaoDich');

// Dữ liệu mẫu
const sampleUsers = [
  {
    name: 'Administrator',
    email: 'admin@fservice.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    phone: '0123456789',
    address: 'Hà Nội, Việt Nam',
    soDu: 10000000
  },
  {
    name: 'Nguyễn Văn Thành Viên',
    email: 'member@fservice.com',
    password: 'member123',
    role: 'member',
    status: 'active',
    phone: '0987654321',
    address: 'TP.HCM, Việt Nam',
    soDu: 5000000
  },
  {
    name: 'Nguyễn Văn Người Dùng',
    email: 'user@fservice.com',
    password: 'user123',
    role: 'user',
    status: 'active',
    phone: '0912345678',
    address: 'Đà Nẵng, Việt Nam',
    soDu: 2000000
  }
];

const sampleServices = [
  {
    TenDichVu: 'Gia sư Toán Lý Hóa',
    MoTa: 'Dạy kèm các môn Toán, Lý, Hóa cho học sinh cấp 2, cấp 3. 10 năm kinh nghiệm giảng dạy.',
    LinhVuc: 'Gia sư',
    Gia: 200000,
    DonVi: 'VND',
    NguoiDung: null, // Sẽ được gán ID của user
    ThanhVien: null, // Sẽ được gán ID của member
    TrangThai: 'da-duyet'
  },
  {
    TenDichVu: 'Sửa chữa laptop PC',
    MoTa: 'Sửa chữa các sự cố phần cứng, phần mềm cho laptop và máy tính bàn. Cài đặt hệ điều hành.',
    LinhVuc: 'Sửa chữa thiết bị',
    Gia: 150000,
    DonVi: 'VND',
    NguoiDung: null, // Sẽ được gán ID của user
    ThanhVien: null, // Sẽ được gán ID của member
    TrangThai: 'da-duyet'
  },
  {
    TenDichVu: 'Thiết kế logo',
    MoTa: 'Thiết kế logo chuyên nghiệp cho doanh nghiệp, cá nhân. Bao gồm các file định dạng khác nhau.',
    LinhVuc: 'Thiết kế',
    Gia: 500000,
    DonVi: 'VND',
    NguoiDung: null, // Sẽ được gán ID của user
    ThanhVien: null, // Sẽ được gán ID của member
    TrangThai: 'da-duyet'
  }
];

const sampleTransactions = [
  {
    Loai: 'deposit',
    SoTien: 5000000,
    MoTa: 'Nạp tiền vào ví',
    TrangThai: 'success',
    NguoiThamGia: null, // Sẽ được gán ID của member
    ThongTinThanhToan: {
      phuongThuc: 'bank_transfer',
      nganHang: 'VCB',
      soTaiKhoan: '123456789'
    }
  },
  {
    Loai: 'deposit',
    SoTien: 2000000,
    MoTa: 'Nạp tiền vào ví',
    TrangThai: 'success',
    NguoiThamGia: null, // Sẽ được gán ID của user
    ThongTinThanhToan: {
      phuongThuc: 'bank_transfer',
      nganHang: 'TCB',
      soTaiKhoan: '987654321'
    }
  },
  {
    Loai: 'service_escrow',
    SoTien: 200000,
    MoTa: 'Ký quỹ thanh toán dịch vụ Gia sư Toán Lý Hóa',
    TrangThai: 'success',
    NguoiThamGia: null, // Sẽ được gán ID của user
    NguoiNhan: null, // Sẽ được gán ID của member
    DichVu: null, // Sẽ được gán ID của service
    ThongTinThanhToan: {
      phuongThuc: 'wallet'
    }
  }
];

// Hàm tạo dữ liệu
async function seedData() {
  try {
    console.log('🌱 Bắt đầu tạo dữ liệu mẫu...');

    // Kết nối database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối đến database');

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await DichVu.deleteMany({});
    await GiaoDich.deleteMany({});
    console.log('🗑️  Đã xóa dữ liệu cũ');

    // Tạo users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`👤 Đã tạo user: ${savedUser.name} (${savedUser.role})`);
    }

    // Tạo services
    const normalUser = createdUsers.find(u => u.role === 'user');
    const memberUser = createdUsers.find(u => u.role === 'member');
    const createdServices = [];
    
    for (const serviceData of sampleServices) {
      const service = new DichVu({
        ...serviceData,
        NguoiDung: normalUser._id,
        ThanhVien: memberUser._id
      });
      const savedService = await service.save();
      createdServices.push(savedService);
      console.log(`🔧 Đã tạo dịch vụ: ${savedService.TenDichVu}`);
    }

    // Tạo transactions
    // Transaction cho member
    const memberTransaction = new GiaoDich({
      ...sampleTransactions[0],
      NguoiThamGia: memberUser._id
    });
    await memberTransaction.save();
    console.log(`💰 Đã tạo transaction cho member: ${memberTransaction.SoTien} VNĐ`);

    // Transaction cho user
    const userTransaction = new GiaoDich({
      ...sampleTransactions[1],
      NguoiThamGia: normalUser._id
    });
    await userTransaction.save();
    console.log(`💰 Đã tạo transaction cho user: ${userTransaction.SoTien} VNĐ`);

    // Transaction ký quỹ dịch vụ
    const escrowTransaction = new GiaoDich({
      ...sampleTransactions[2],
      NguoiThamGia: normalUser._id,
      NguoiNhan: memberUser._id,
      DichVu: createdServices[0]._id
    });
    await escrowTransaction.save();
    console.log(`💰 Đã tạo transaction ký quỹ: ${escrowTransaction.SoTien} VNĐ`);

    console.log('\n🎉 Tạo dữ liệu mẫu thành công!');
    console.log('\n📋 Thông tin tài khoản:');
    console.log('👑 Admin: admin@fservice.com / admin123');
    console.log('👤 Member: member@fservice.com / member123');
    console.log('👤 User: user@fservice.com / user123');
    console.log('\n🌐 Đăng nhập tại: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối database');
  }
}

// Chạy hàm
if (require.main === module) {
  seedData();
}

module.exports = seedData;
