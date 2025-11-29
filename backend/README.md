# F-Service Backend API

Backend API server cho ứng dụng F-Service.

## Yêu cầu

- Node.js >= 14.x
- MongoDB >= 4.x
- npm hoặc yarn

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cấu hình các biến môi trường trong file `.env`:
- `PORT`: Port chạy server (mặc định: 5000)
- `MONGODB_URI`: URI kết nối MongoDB
- `JWT_SECRET`: Secret key cho JWT
- `FRONTEND_URL`: URL của frontend (cho CORS)

4. Chạy migrations (nếu có):
```bash
npm run migrate
```

5. Seed dữ liệu mẫu (tùy chọn):
```bash
npm run seed
```

## Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server sẽ chạy tại `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/profile` - Cập nhật profile
- `PUT /api/auth/password` - Đổi mật khẩu

### User
- `GET /api/user/dashboard` - Lấy dữ liệu dashboard
- `GET /api/user/home` - Lấy dữ liệu trang chủ
- `GET /api/user/profile` - Lấy thông tin profile
- `GET /api/user/commissions` - Lấy danh sách ủy thác
- `GET /api/user/transactions` - Lấy lịch sử giao dịch
- `POST /api/user/request` - Tạo yêu cầu dịch vụ

### Services
- `GET /api/services/list` - Lấy danh sách dịch vụ
- `POST /api/services/commission` - Tạo ủy thác
- `GET /api/services/my-commissions` - Lấy ủy thác của tôi
- `GET /api/services/:id` - Lấy chi tiết ủy thác

### Wallet
- `GET /api/wallet` - Lấy thông tin ví
- `GET /api/wallet/balance` - Lấy số dư ví
- `POST /api/wallet/deposit` - Nạp tiền
- `POST /api/wallet/withdraw` - Rút tiền
- `GET /api/wallet/transactions` - Lấy lịch sử giao dịch

### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/users` - Lấy danh sách users
- `POST /api/admin/user/:userId/status` - Cập nhật trạng thái user

## Authentication

API sử dụng JWT (JSON Web Token) để xác thực. Sau khi đăng nhập thành công, token sẽ được trả về trong response. Client cần gửi token này trong header `Authorization`:

```
Authorization: Bearer <token>
```

## Cấu trúc thư mục

```
backend/
├── config/          # Cấu hình (db, app, session)
├── controllers/     # Controllers xử lý logic
├── middleware/      # Middleware (auth, error handler)
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utilities
├── scripts/         # Scripts (migrate, seed)
├── server.js        # Entry point
└── package.json     # Dependencies
```

## License

ISC

