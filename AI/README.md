# Dự án Dự báo Chất lượng Không khí (AQI)

Dự án này sử dụng mô hình AI (LSTM) để dự báo chỉ số chất lượng không khí (AQI) dựa trên các dữ liệu cảm biến. Hệ thống được cung cấp dưới dạng một API, cho phép các ứng dụng khác dễ dàng tích hợp và sử dụng.

## 🚀 Công nghệ sử dụng

- **Backend:** Python (Flask/FastAPI)
- **AI/ML:** TensorFlow/Keras, Scikit-learn
- **Deployment:** Docker, Docker Compose

---

## ⚙️ Hướng dẫn Cài đặt và Chạy

Có hai cách để chạy dự án: sử dụng **Docker** (khuyến nghị) hoặc chạy **cục bộ** (manual).

### Cách 1: Sử dụng Docker (Khuyến nghị)

Đây là cách đơn giản và nhanh nhất để chạy dự án mà không cần lo lắng về môi trường hay các thư viện phụ thuộc.

**Yêu cầu:**
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

**Các bước thực hiện:**

1.  **Clone repository** về máy của bạn.

2.  **Cấu hình môi trường:**
    File `docker-compose.yml` sẽ sử dụng các biến môi trường từ file `.env`. Hãy sao chép file `.env-docker` để tạo file `.env`:

    ```bash
    # Đối với Windows
    copy .env-docker .env

    # Đối với macOS/Linux
    cp .env-docker .env
    ```

3.  **Khởi chạy dự án:**
    Mở terminal trong thư mục gốc của dự án và chạy lệnh sau:

    ```bash
    docker-compose up --build -d
    ```
    Lệnh này sẽ build image và khởi chạy container ở chế độ nền.

4.  **Kiểm tra:**
    API sẽ chạy ở địa chỉ `http://localhost:5000` (hoặc cổng bạn đã cấu hình trong file `.env`).

5.  **Dừng dự án:**
    Để dừng các container, chạy lệnh:
    ```bash
    docker-compose down
    ```

---

### Cách 2: Chạy Cục bộ (Manual Setup)

Cách này yêu cầu bạn phải cài đặt Python và các thư viện cần thiết trên máy.

**Yêu cầu:**
- [Python 3.8+](https://www.python.org/downloads/)
- `pip`

**Các bước thực hiện:**

1.  **Clone repository** về máy của bạn.

2.  **Tạo và kích hoạt môi trường ảo (virtual environment):**
    Điều này giúp quản lý các thư viện của dự án một cách độc lập.

    ```bash
    # Tạo môi trường ảo
    python -m venv venv

    # Kích hoạt môi trường ảo
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Cài đặt các thư viện cần thiết:**
    Tất cả các thư viện được liệt kê trong file `requirements.txt`.

    ```bash
    pip install -r requirements.txt
    ```

4.  **Cấu hình môi trường:**
    Sao chép file `.env` (hoặc tạo mới) và điền các thông tin cần thiết.
    ```bash
    # Windows
    copy .env .env

    # macOS/Linux
    cp .env .env
    ```

5.  **Chạy ứng dụng:**
    ```bash
    python app.py
    ```
    API sẽ khởi động và sẵn sàng nhận yêu cầu.

---

## 📖 Cách sử dụng API

Sau khi khởi chạy thành công, bạn có thể gửi yêu cầu đến API để nhận kết quả dự báo.

- **Endpoint:** `POST /predict`
- **Headers:** `Content-Type: application/json`

**Ví dụ Request Body:**
Dữ liệu đầu vào là một JSON object chứa ID của trạm và các giá trị cảm biến.

```json
{
  "station_id": 3276373,
  "data": [
    [
      25.0,  // PM2.5
      50.0,  // PM10
      10.0,  // NO2
      5.0,   // CO
      15.0,  // SO2
      30.0,  // O3
      28.0,  // Temperature
      75.0,  // Humidity
      1012.0 // Pressure
    ]
    // ... có thể thêm nhiều mốc thời gian khác
  ]
}
```

**Ví dụ Response Body (Success):**

```json
{
  "station_id": 3276373,
  "predicted_aqi": 85
}
```

**Ví dụ Response Body (Error):**

```json
{
  "error": "Model for station_id 12345 not found."
}
```

---
## 🧠 Huấn luyện Model

Nếu bạn quan tâm đến quá trình huấn luyện mô hình, có thể tham khảo file Jupyter Notebook tại:
`train/lstm-aqi.ipynb`
