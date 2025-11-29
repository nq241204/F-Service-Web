# F-Service Frontend

Frontend application cho F-Service sử dụng React và Vite.

## Yêu cầu

- Node.js >= 14.x
- npm hoặc yarn

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

3. Cấu hình biến môi trường trong file `.env`:
- `VITE_API_URL`: URL của backend API (mặc định: http://localhost:5000/api)

## Chạy ứng dụng

### Development
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Build cho Production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## Cấu trúc thư mục

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # React components
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── config/      # Configuration
│   ├── App.jsx      # Main App component
│   └── main.jsx     # Entry point
├── vite.config.js   # Vite configuration
└── package.json     # Dependencies
```

## Tính năng

- Đăng ký/Đăng nhập
- Dashboard
- Quản lý profile
- Quản lý ví
- Quản lý dịch vụ
- Quản lý ủy thác
- Lịch sử giao dịch

## Authentication

Frontend sử dụng JWT token được lưu trong `localStorage`. Token sẽ được tự động gửi kèm trong header `Authorization` của mỗi request đến API.

## API Integration

Frontend sử dụng `axios` để gọi API. Tất cả các API calls được định nghĩa trong thư mục `src/services/`.

## License

ISC
