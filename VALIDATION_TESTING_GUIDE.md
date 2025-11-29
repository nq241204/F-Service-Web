# Hướng dẫn Testing Validation cho F-Service

## 📋 Mục lục
- [Tổng quan](#tổng-quan)
- [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
- [Testing User Validation](#testing-user-validation)
- [Testing Service Validation](#testing-service-validation)
- [Testing Transaction Validation](#testing-transaction-validation)
- [Test Cases cho từng API](#test-cases-cho-từng-api)
- [Kịch bản test thực tế](#kịch-bản-test-thực-tế)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

Guide này giúp bạn testing validation cho toàn bộ hệ thống F-Service, đảm bảo dữ liệu đầu vào tuân thủ đúng schema và business rules.

### **Models cần test:**
- **User** - Quản lý người dùng, member, admin
- **DichVu** - Quản lý dịch vụ ủy thác
- **GiaoDich** - Quản lý giao dịch tài chính

---

## 🛠️ Chuẩn bị môi trường

### **1. Khởi động backend**
```bash
cd backend
npm run dev
```

### **2. Tạo dữ liệu test**
```bash
npm run seeddata
```

### **3. Công cụ test**
- **Postman** - GUI testing
- **curl** - Command line testing
- **Thunder Client** - VS Code extension

---

## 👤 Testing User Validation

### **Schema User.js:**
```javascript
{
  name: { required: true, minlength: 2 },
  email: { required: true, unique: true, email format },
  password: { required: true, minlength: 6 },
  role: { enum: ['user', 'member', 'admin'], default: 'user' },
  status: { enum: ['active', 'inactive', 'banned'], default: 'active' },
  phone: { optional, string },
  address: { optional, string },
  soDu: { number, default: 0 }
}
```

### **Test Cases:**

#### **✅ Valid Cases**
```bash
# 1. Tạo user hợp lệ
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "test@example.com",
    "password": "123456",
    "role": "user",
    "phone": "0123456789",
    "address": "Hà Nội"
  }'
```

#### **❌ Invalid Cases**
```bash
# 1. Thiếu name
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
# Expected: 400 - "Tên không được để trống"

# 2. Name quá ngắn
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "test@example.com",
    "password": "123456"
  }'
# Expected: 400 - "Tên phải có ít nhất 2 ký tự"

# 3. Email không hợp lệ
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "invalid-email",
    "password": "123456"
  }'
# Expected: 400 - "Email không hợp lệ"

# 4. Email trùng lặp
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn B",
    "email": "admin@fservice.com",
    "password": "123456"
  }'
# Expected: 400 - "Email đã tồn tại"

# 5. Password quá ngắn
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "test2@example.com",
    "password": "123"
  }'
# Expected: 400 - "Mật khẩu phải có ít nhất 6 ký tự"

# 6. Role không hợp lệ
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "test3@example.com",
    "password": "123456",
    "role": "invalid_role"
  }'
# Expected: 400 - "Role không hợp lệ"

# 7. Status không hợp lệ
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "test4@example.com",
    "password": "123456",
    "status": "invalid_status"
  }'
# Expected: 400 - "Trạng thái không hợp lệ"
```

---

## 🔧 Testing Service Validation

### **Schema DichVu.js:**
```javascript
{
  TenDichVu: { required: true },
  MoTa: { optional },
  LinhVuc: { required: true },
  Gia: { required: true, min: 0 },
  DonVi: { enum: ['VND', 'giờ', 'buổi', 'lần'], default: 'VND' },
  NguoiDung: { required: true, ref: 'User' },
  ThanhVien: { optional, ref: 'Member' },
  TrangThai: { enum: ['cho-duyet', 'da-duyet', 'dang-thuc-hien', ...], default: 'cho-duyet' }
}
```

### **Test Cases:**

#### **✅ Valid Cases**
```bash
# 1. Tạo dịch vụ hợp lệ (cần token)
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "TenDichVu": "Gia sư tiếng Anh",
    "MoTa": "Dạy kèm tiếng Anh giao tiếp",
    "LinhVuc": "Gia sư",
    "Gia": 300000,
    "DonVi": "VND"
  }'
```

#### **❌ Invalid Cases**
```bash
# 1. Thiếu TenDichVu
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "MoTa": "Dạy kèm tiếng Anh",
    "LinhVuc": "Gia sư",
    "Gia": 300000
  }'
# Expected: 400 - "Tên dịch vụ là bắt buộc"

# 2. Thiếu LinhVuc
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "TenDichVu": "Gia sư tiếng Anh",
    "MoTa": "Dạy kèm tiếng Anh",
    "Gia": 300000
  }'
# Expected: 400 - "Lĩnh vực dịch vụ là bắt buộc"

# 3. Gia âm
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "TenDichVu": "Gia sư tiếng Anh",
    "LinhVuc": "Gia sư",
    "Gia": -100000
  }'
# Expected: 400 - "Giá không được âm"

# 4. DonVi không hợp lệ
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "TenDichVu": "Gia sư tiếng Anh",
    "LinhVuc": "Gia sư",
    "Gia": 300000,
    "DonVi": "invalid_unit"
  }'
# Expected: 400 - "DonVi không hợp lệ"

# 5. TrangThai không hợp lệ
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "TenDichVu": "Gia sư tiếng Anh",
    "LinhVuc": "Gia sư",
    "Gia": 300000,
    "TrangThai": "invalid_status"
  }'
# Expected: 400 - "Trạng thái không hợp lệ"
```

---

## 💰 Testing Transaction Validation

### **Schema GiaoDich.js:**
```javascript
{
  Loai: { required: true, enum: ['deposit', 'withdraw', 'commission_payment', ...] },
  SoTien: { required: true, min: 1 },
  MoTa: { optional },
  TrangThai: { enum: ['pending', 'success', 'failed', 'cancelled'], default: 'pending' },
  NguoiThamGia: { required: true, ref: 'User' },
  NguoiNhan: { optional, ref: 'User' },
  DichVu: { optional, ref: 'DichVu' }
}
```

### **Test Cases:**

#### **✅ Valid Cases**
```bash
# 1. Nạp tiền hợp lệ
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "Loai": "deposit",
    "SoTien": 1000000,
    "MoTa": "Nạp tiền vào ví",
    "ThongTinThanhToan": {
      "phuongThuc": "bank_transfer",
      "nganHang": "VCB"
    }
  }'
```

#### **❌ Invalid Cases**
```bash
# 1. Thiếu Loai
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "SoTien": 1000000,
    "MoTa": "Nạp tiền vào ví"
  }'
# Expected: 400 - "Loai là bắt buộc"

# 2. SoTien quá nhỏ
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "Loai": "deposit",
    "SoTien": 0,
    "MoTa": "Nạp tiền vào ví"
  }'
# Expected: 400 - "SoTien phải lớn hơn 0"

# 3. SoTien âm
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "Loai": "deposit",
    "SoTien": -100000,
    "MoTa": "Nạp tiền vào ví"
  }'
# Expected: 400 - "SoTien phải lớn hơn 0"

# 4. Loai không hợp lệ
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "Loai": "invalid_type",
    "SoTien": 1000000,
    "MoTa": "Nạp tiền vào ví"
  }'
# Expected: 400 - "Loai không hợp lệ"

# 5. TrangThai không hợp lệ
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "Loai": "deposit",
    "SoTien": 1000000,
    "MoTa": "Nạp tiền vào ví",
    "TrangThai": "invalid_status"
  }'
# Expected: 400 - "Trạng thái không hợp lệ"
```

---

## 🧪 Test Cases cho từng API

### **Authentication APIs**

#### **POST /api/auth/register**
| Field | Valid | Invalid | Expected Error |
|-------|-------|---------|----------------|
| name | "Nguyễn Văn A" | "", "A" | Required, min 2 chars |
| email | "test@example.com" | "invalid", "" | Required, email format |
| password | "123456" | "123", "" | Required, min 6 chars |
| role | "user", "member", "admin" | "invalid" | Enum values only |
| status | "active", "inactive", "banned" | "invalid" | Enum values only |

#### **POST /api/auth/login**
| Field | Valid | Invalid | Expected Error |
|-------|-------|---------|----------------|
| email | "admin@fservice.com" | "invalid", "" | Required field |
| password | "admin123" | "wrong", "" | Required field |

### **Service APIs**

#### **POST /api/services**
| Field | Valid | Invalid | Expected Error |
|-------|-------|---------|----------------|
| TenDichVu | "Gia sư Toán" | "", null | Required field |
| MoTa | "Mô tả dịch vụ" | "" | Optional field |
| LinhVuc | "Gia sư" | "", null | Required field |
| Gia | 100000, 0 | -1000, null | Required, min 0 |
| DonVi | "VND", "giờ", "buổi", "lần" | "invalid" | Enum values only |
| TrangThai | "cho-duyet", "da-duyet" | "invalid" | Enum values only |

### **Wallet APIs**

#### **POST /api/wallet/deposit**
| Field | Valid | Invalid | Expected Error |
|-------|-------|---------|----------------|
| Loai | "deposit" | "invalid", "" | Required, enum |
| SoTien | 100000, 1 | 0, -1000, "" | Required, min 1 |
| MoTa | "Nạp tiền" | "" | Optional field |
| TrangThai | "pending", "success" | "invalid" | Enum values only |

---

## 🎭 Kịch bản test thực tế

### **Scenario 1: User Registration Flow**
```bash
# Step 1: Register valid user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "123456",
    "role": "user"
  }'

# Step 2: Login with created user
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "123456"
  }'

# Step 3: Try to register with same email (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another User",
    "email": "testuser@example.com",
    "password": "123456",
    "role": "user"
  }'
```

### **Scenario 2: Service Creation Flow**
```bash
# Step 1: Login as user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@fservice.com",
    "password": "user123"
  }' | jq -r '.token')

# Step 2: Create valid service
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "TenDichVu": "Test Service",
    "MoTa": "Test description",
    "LinhVuc": "Test",
    "Gia": 100000
  }'

# Step 3: Try to create service without token (should fail)
curl -X POST http://localhost:5000/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "TenDichVu": "Test Service 2",
    "MoTa": "Test description",
    "LinhVuc": "Test",
    "Gia": 100000
  }'
```

### **Scenario 3: Transaction Flow**
```bash
# Step 1: Login as user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@fservice.com",
    "password": "user123"
  }' | jq -r '.token')

# Step 2: Create valid deposit
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "Loai": "deposit",
    "SoTien": 500000,
    "MoTa": "Test deposit"
  }'

# Step 3: Try invalid amount (should fail)
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "Loai": "deposit",
    "SoTien": -1000,
    "MoTa": "Invalid deposit"
  }'
```

---

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. MongoDB Connection Error**
```bash
# Check MongoDB connection
curl http://localhost:5000/api/health
```

#### **2. Validation Not Working**
- Check if validation middleware is properly configured
- Verify schema definitions in models
- Ensure proper error handling in controllers

#### **3. Authorization Issues**
- Ensure JWT token is valid
- Check token expiration
- Verify user permissions

#### **4. Database Schema Mismatch**
```bash
# Check database structure
cd backend
npm run view-db
```

### **Debug Tips:**

1. **Enable detailed logging:**
```javascript
// In controller
console.log('Request body:', req.body);
console.log('Validation errors:', validationResult(req));
```

2. **Check MongoDB data:**
```bash
# View all users
npm run view-users

# View database stats
npm run view-stats
```

3. **Test with Postman:**
- Import collection from docs
- Use environment variables
- Check response headers and body

---

## 📝 Checklist Testing

### **User Validation:**
- [ ] Register with valid data
- [ ] Register with missing required fields
- [ ] Register with invalid email format
- [ ] Register with short password
- [ ] Register with duplicate email
- [ ] Register with invalid role/status
- [ ] Login with valid credentials
- [ ] Login with invalid credentials

### **Service Validation:**
- [ ] Create service with valid data
- [ ] Create service with missing required fields
- [ ] Create service with negative price
- [ ] Create service with invalid unit
- [ ] Create service with invalid status
- [ ] Create service without authentication

### **Transaction Validation:**
- [ ] Create transaction with valid data
- [ ] Create transaction with missing required fields
- [ ] Create transaction with invalid amount
- [ ] Create transaction with invalid type
- [ ] Create transaction without authentication

---

## 🚀 Next Steps

1. **Automated Testing:** Setup Jest/Mocha for unit tests
2. **API Documentation:** Use Swagger/OpenAPI
3. **Load Testing:** Use Artillery or k6
4. **Security Testing:** OWASP ZAP, Burp Suite

---

**📞 Support:**
- Check logs in `backend/logs/` directory
- Review validation errors in console
- Use browser dev tools for frontend validation

**🎯 Remember:** Validation is the first line of defense against bad data!
