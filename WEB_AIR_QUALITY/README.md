# Hệ thống giám sát chất lượng không khí IoT

Dự án này là một ứng dụng web đầy đủ được xây dựng bằng Node.js và Express, được thiết kế để giám sát chất lượng không khí theo thời gian thực. Nó có một bảng điều khiển quản trị để quản lý thiết bị, người dùng và phân tích dữ liệu.

## ✨ Tính năng

- **Xác thực người dùng:** Đăng ký, đăng nhập (bao gồm cả Google OAuth), đặt lại mật khẩu.
- **Bảng điều khiển quản trị:**
    - **Tổng quan:** Giao diện trực quan với bản đồ hiển thị các nút cảm biến.
    - **Quản lý thiết bị:** Thêm, xóa và quản lý các thiết bị IoT.
    - **Quản lý người dùng:** Quản lý người dùng và quyền của họ.
    - **Phân tích dữ liệu:** Biểu đồ và đồ thị để trực quan hóa dữ liệu chất lượng không khí.
    - **Trình giả lập:** Mô phỏng dữ liệu từ thiết bị IoT để thử nghiệm.
- **API an toàn:** Các điểm cuối API để nhận dữ liệu từ các thiết bị IoT.
- **Thông báo:** Hệ thống cảnh báo khi các chỉ số chất lượng không khí vượt ngưỡng.

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js:** Môi trường thực thi JavaScript.
- **Express.js:** Framework web cho Node.js.
- **MongoDB:** Cơ sở dữ liệu NoSQL chính để lưu trữ dữ liệu người dùng và thiết bị.
- **ClickHouse:** Cơ sở dữ liệu hướng cột để lưu trữ và phân tích dữ liệu chuỗi thời gian (dữ liệu cảm biến).
- **Redis:** Kho lưu trữ dữ liệu trong bộ nhớ cho quản lý phiên và caching.
- **Passport.js:** Middleware xác thực cho Node.js (sử dụng cho Google OAuth).
- **JSON Web Tokens (JWT):** Để bảo mật các điểm cuối API.
- **Nodemailer:** Để gửi email (ví dụ: đặt lại mật khẩu).

### Frontend
- **EJS (Embedded JavaScript templates):** Công cụ tạo khuôn mẫu.
- **AdminLTE:** Mẫu bảng điều khiển và giao diện người dùng.
- **Bootstrap:** Framework CSS.
- **Chart.js:** Để hiển thị biểu đồ phân tích.

### DevOps
- **Docker:** Để đóng gói ứng dụng.

## 🚀 Bắt đầu

### Yêu cầu tiên quyết

- [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [Redis](https://redis.io/docs/getting-started/installation/)
- [ClickHouse](https://clickhouse.com/docs/en/install)
- [Git](https://git-scm.com/)

### Cài đặt

1.  **Clone repository:**
    ```bash
    git clone https://github.com/hoaze247/AIR_QUALITY.git
    cd AIR_QUALITY
    ```

2.  **Cài đặt các dependency:**
    ```bash
    npm install
    ```

### Chạy ứng dụng

Chạy ứng dụng ở chế độ phát triển (với hot-reload):
```bash
npm start
```
Ứng dụng sẽ có sẵn tại `http://localhost:4000`.

## 📁 Cấu trúc dự án

```
/
├── src/
│   ├── config/         # Cấu hình (DB, session, passport)
│   ├── controllers/    # Logic xử lý request
│   ├── middlewares/    # Middleware của Express
│   ├── models/         # Mongoose và các schema khác
│   ├── public/         # Tài sản tĩnh (CSS, JS, images)
│   ├── routers/        # Định tuyến Express
│   ├── services/       # Logic nghiệp vụ (nếu có)
│   ├── utils/          # Các hàm tiện ích
│   └── views/          # Tệp khuôn mẫu EJS
├── .env                # Biến môi trường
├── app.js              # Điểm vào chính của ứng dụng
├── package.json        # Dependencies và scripts
└── Dockerfile          # Cấu hình Docker
```

---
*README này được tạo tự động.*
