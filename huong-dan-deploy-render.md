# Hướng dẫn Triển khai F-Service trên Render

## 📋 Yêu cầu Chuẩn bị

Trước khi bắt đầu, hãy đảm bảo bạn có:
- ✅ Tài khoản GitHub với repository F-Service
- ✅ Tài khoản email (Gmail recommended)
- ✅ MongoDB Atlas account (đã có trong project)
- ✅ Mã nguồn đã push lên GitHub

---

## 🚀 Bước 1: Tạo Tài khoản Render

### 1.1 Đăng ký Render
1. Truy cập [render.com](https://render.com)
2. Click **"Sign Up"** 
3. Chọn **"Sign up with GitHub"** (khuyến khích)
4. Đăng nhập và xác minh email

### 1.2 Xác minh Tài khoản
1. Kiểm tra email và click link xác minh
2. Hoàn thành profile nếu được yêu cầu
3. Chọn plan **Free** (hoặc Pro nếu cần)

---

## 🔗 Bước 2: Kết nối GitHub Repository

### 2.1 Authorize GitHub
1. Trong dashboard Render, click **"New +"**
2. Chọn **"Web Service"**
3. Click **"Connect a repository"**
4. Authorize Render truy cập GitHub
5. Tìm repository **F-Service**
6. Click **"Connect"**

---

## 🖥️ Bước 3: Triển khai Backend

### 3.1 Cấu hình Backend Service
1. **Name:** `f-service-backend`
2. **Environment:** `Node`
3. **Root Directory:** `backend`
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Instance Type:** `Free` (hoặc Starter)

### 3.2 Advanced Settings
1. **Auto-Deploy:** ✅ Bật
2. **Health Check Path:** `/api/health`

### 3.3 Click **"Create Web Service"**

---

## 🔧 Bước 4: Cấu hình Environment Variables cho Backend

### 4.1 Vào Cài đặt Environment
1. Chờ service được tạo
2. Vào **Service** → **Settings** → **Environment**
3. Click **"Add Environment Variable"

### 4.2 Thêm các biến sau:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://nguyendangkhoa138204_db_user:alenword@db-f-service.jsq5xwz.mongodb.net/Db-F-service?retryWrites=true&w=majority&appName=Db-F-service
JWT_SECRET=ffb63635a2e2f38cd3b807dedde0ffb08b6f21240a7415673285848ae8057ad8cdc86ff58c0c3bbc93e18e94978a3ae3ac793f7c7b1164214741666cf66b0f94
JWT_EXPIRES_IN=7d
SESSION_SECRET=603a770b96a561873614eb7576339ff8a8ef56fd1ff25cfce0f00e551e6a4b6c987e6d0ba2caae531b25f9933a01fe85361c0a57c9165590701acee7eaf4cf96
SESSION_MAX_AGE=86400000
FRONTEND_URL=https://your-frontend.onrender.com
API_SECRET=f6e4a35b57ad49c9b70ffa1f428e1188b2dc4d30c7cabb25c7951d47f9e5ed70
DB_ENCRYPTION_KEY=b5fdc5097a1a64e75e7c2df45f08d770a89721f4a1427a61bfb0b6df4a76e9cb
OAUTH_CLIENT_SECRET=8ee28951007d31e3c1758b2f2ebb07b653301741a96f97cac9c898d64b7b03db
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=900000
ENABLE_CSP=true
ENABLE_HSTS=true
ENABLE_XSS_PROTECTION=true
SECURITY_LOGGING=true
AUDIT_TRAIL=true
INTRUSION_DETECTION=true
```

### 4.3 Email Configuration (tùy chọn)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_ENCRYPTION_KEY=e2503966aa9d81d76e106623a3022e248e1612215469cf3dafd8d68f535f51e7
```

### 4.4 Lưu lại
1. Click **"Save Changes"**
2. Render sẽ tự động redeploy

---

## 🌐 Bước 5: Triển khai Frontend

### 5.1 Tạo Static Site
1. Quay lại dashboard Render
2. Click **"New +"**
3. Chọn **"Static Site"**
4. Chọn cùng repository F-Service

### 5.2 Cấu hình Frontend
1. **Name:** `f-service-frontend`
2. **Root Directory:** `frontend`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. **Node Version:** `18` (hoặc mới hơn)

### 5.3 Click **"Create Static Site"**

---

## ⚙️ Bước 6: Cấu hình Environment cho Frontend

### 6.1 Thêm Environment Variables
1. Vào Frontend Service → **Settings** → **Environment**
2. Click **"Add Environment Variable"**
3. Thêm biến:

```bash
VITE_API_URL=https://your-backend-name.onrender.com
```

**Lưu ý:** Thay `your-backend-name` bằng tên backend service của bạn.

### 6.2 Cập nhật FRONTEND_URL
1. Quay lại Backend Service
2. Sửa biến `FRONTEND_URL`
3. Thay bằng URL frontend của bạn: `https://your-frontend-name.onrender.com`

---

## 🔄 Bước 7: Deploy và Test

### 7.1 Kiểm tra Deployment Status
1. Backend Service: Đợi "Live" với ✅ xanh
2. Frontend Service: Đợi "Live" với ✅ xanh

### 7.2 Test Backend
1. Mở browser: `https://your-backend-name.onrender.com/api/health`
2. Phải thấy response: `{"status":"ok","message":"Server is running"}`

### 7.3 Test Frontend
1. Mở browser: `https://your-frontend-name.onrender.com`
2. Kiểm tra trang load đúng
3. Test đăng ký/đăng nhập

---

## 🔗 Bước 8: Kiểm tra Kết nối

### 8.1 Test API Calls
1. Mở DevTools (F12) trong frontend
2. Thử đăng ký tài khoản mới
3. Kiểm tra Network tab:
   - API calls phải đi đến backend URL đúng
   - Không có CORS errors

### 8.2 Test Functions
- ✅ Đăng ký user
- ✅ Đăng nhập
- ✅ Tạo dịch vụ
- ✅ Quản lý ví
- ✅ Admin functions (nếu có)

---

## 🛠️ Bước 9: Xử lý Lỗi Thường Gặp

### 9.1 CORS Error
**Lỗi:** "Access-Control-Allow-Origin"
**Giải pháp:**
1. Kiểm tra `FRONTEND_URL` trong backend env
2. Đảm bảo URL frontend chính xác
3. Redeploy backend

### 9.2 Database Connection Error
**Lỗi:** "MongoDB connection failed"
**Giải pháp:**
1. Kiểm tra `MONGODB_URI` trong backend env
2. Xác minh IP whitelist trong MongoDB Atlas
3. Kiểm tra network access

### 9.3 Build Failed
**Lỗi:** Frontend build không thành công
**Giải pháp:**
1. Kiểm tra `VITE_API_URL` trong frontend env
2. Xem build logs trong dashboard
3. Kiểm tra Node.js version

### 9.4 502 Bad Gateway
**Lỗi:** Service không response
**Giải pháp:**
1. Kiểm tra service logs
2. Đảm bảo start command đúng
3. Kiểm tra port binding

---

## 📊 Bước 10: Monitoring và Maintenance

### 10.1 Monitoring
1. **Logs:** Vào Service → **Logs**
2. **Metrics:** Xem performance metrics
3. **Health Checks:** Tự động kiểm tra health

### 10.2 Regular Tasks
- **Hàng tuần:** Kiểm tra logs và errors
- **Hàng tháng:** Update dependencies
- **Hàng quý:** Review security settings

---

## 🎯 Bước 11: Tùy chọn Nâng cao

### 11.1 Custom Domain
1. Vào Service → **Settings** → **Custom Domains**
2. Thêm domain của bạn
3. Cấu hình DNS records:
   ```
   Type: CNAME
   Name: @ (hoặc www)
   Value: your-service-name.onrender.com
   ```

### 11.2 SSL Certificate
- Render tự động cung cấp SSL miễn phí
- Certificate sẽ được tự động renew

### 11.3 Environment Branches
- **Production:** Branch `main`
- **Staging:** Branch `develop`
- **Feature:** Branch features

---

## 📱 Bước 12: Mobile Testing

### 12.1 Responsive Test
1. Test trên mobile devices
2. Kiểm tra touch interactions
3. Verify performance

### 12.2 PWA Features
- Test offline functionality
- Check app installation
- Verify push notifications

---

## ✅ Checklist Hoàn thành

### Backend Checklist
- [ ] Service đang "Live" ✅
- [ ] Health endpoint working ✅
- [ ] Database connected ✅
- [ ] Environment variables configured ✅
- [ ] No CORS errors ✅

### Frontend Checklist
- [ ] Site loading properly ✅
- [ ] API calls working ✅
- [ ] Authentication working ✅
- [ ] Mobile responsive ✅
- [ ] No console errors ✅

### Security Checklist
- [ ] HTTPS enabled ✅
- [ ] Environment variables secured ✅
- [ ] Database access restricted ✅
- [ ] Rate limiting active ✅

---

## 🎉 Hoàn thành!

Xin chúc mừng! F-Service của bạn đã được triển khai thành công trên Render.

### URL của bạn:
- **Frontend:** `https://your-frontend-name.onrender.com`
- **Backend API:** `https://your-backend-name.onrender.com/api`

### Các bước tiếp theo:
1. Chia sẻ URL với người dùng
2. Monitor performance và errors
3. Collect user feedback
4. Plan cho updates và improvements

### Hỗ trợ:
- **Render Documentation:** [docs.render.com](https://docs.render.com)
- **MongoDB Atlas:** [cloud.mongodb.com](https://cloud.mongodb.com)
- **GitHub Issues:** Report bugs trong repository

---

**Chúc bạn thành công với F-Service! 🚀**
