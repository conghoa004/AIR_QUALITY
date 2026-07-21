# Hướng dẫn sử dụng API Backend

Đây là tài liệu hướng dẫn cho ứng dụng backend quản lý chất lượng không khí.

## Cài đặt

1.  Clone a repository:
    ```bash
    git clone https://github.com/your-username/your-repo.git
    ```
2.  Cài đặt các thư viện cần thiết:
    ```bash
    npm install
    ```
3.  Tạo file `.env` ở thư mục gốc và cấu hình các biến môi trường cần thiết (xem phần **Cấu hình** bên dưới).

4.  Chạy ứng dụng:
    ```bash
    npm start
    ```

## Cấu trúc thư mục

```
src/
├── config/         # Chứa các file cấu hình (database, session,...) 
├── controllers/    # Xử lý logic và tương tác với models
├── middlewares/    # Các middleware (xác thực, kiểm tra quyền,...)
├── models/         # Định nghĩa schema cho database
├── public/         # Chứa các file tĩnh (hình ảnh,...)
├── routers/        # Định tuyến các endpoints
└── utils/          # Các hàm tiện ích
```

---

## Xác thực với JSON Web Token (JWT)

Hệ thống sử dụng Access Token và Refresh Token để xác thực người dùng.

### 1. Luồng xác thực

1.  **Đăng nhập**: Người dùng gửi `email` và `password` đến endpoint `POST /api/auth/login`.
2.  **Nhận Tokens**: Nếu thông tin hợp lệ, server sẽ trả về một `accessToken` và một `user object`. `refreshToken` sẽ được lưu trong session phía server.
3.  **Truy cập tài nguyên**: Để truy cập các route được bảo vệ, người dùng phải gửi `accessToken` trong `Authorization` header.
4.  **Làm mới Token**: `accessToken` có thời gian hết hạn ngắn. Khi hết hạn, người dùng có thể gọi đến endpoint `POST /api/auth/refresh-token` để nhận một `accessToken` mới mà không cần đăng nhập lại.

### 2. Các Endpoint chính

#### `POST /api/auth/login`

Dùng để đăng nhập và nhận token.

-   **Request Body**:
    ```json
    {
      "email": "user@example.com",
      "password": "yourpassword"
    }
    ```
-   **Response (Thành công)**:
    ```json
    {
      "message": "Login success",
      "accessToken": "ey...",
      "user": {
        "id": "60d...",
        "email": "user@example.com",
        "role": "User"
      }
    }
    ```

#### `POST /api/auth/refresh-token`

Dùng để lấy `accessToken` mới khi `accessToken` cũ đã hết hạn. Endpoint này sử dụng `refreshToken` được lưu trong session để xác thực.

-   **Response (Thành công)**:
    ```json
    {
      "accessToken": "ey... (new token)"
    }
    ```

### 3. Sử dụng Access Token

Để truy cập các API yêu cầu xác thực, bạn cần đính kèm `accessToken` vào header `Authorization` của mỗi request theo định dạng `Bearer`.

-   **Header**:
    `Authorization: Bearer <your_access_token>`

-   **Ví dụ với `curl`**:
    ```bash
    curl -X GET http://localhost:3000/api/some-protected-route \
         -H "Authorization: Bearer ey..."
    ```

Middleware `verifyAccessToken` sẽ kiểm tra tính hợp lệ của token. Nếu token không hợp lệ hoặc thiếu, server sẽ trả về lỗi `401 Unauthorized`.

## Cấu hình Biến môi trường (`.env`)

Bạn cần tạo một file `.env` ở thư mục gốc với các biến sau để hệ thống JWT hoạt động:

```env
# Secret key để ký Access Token
ACCESS_TOKEN_SECRET=your_access_token_secret_key

# Secret key để ký Refresh Token
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key

# Thời gian sống của Access Token (ví dụ: 15m, 1h, 1d)
ACCESS_TOKEN_LIFE=15m

# Thời gian sống của Refresh Token (ví dụ: 7d)
REFRESH_TOKEN_LIFE=7d
```
