# 🌱 HỆ THỐNG GIÁM SÁT & DỰ ĐOÁN CHẤT LƯỢNG KHÔNG KHÍ IOT ĐA NỀN TẢNG (AIR QUALITY IOT SYSTEM)

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Apache Spark](https://img.shields.io/badge/Apache%20Spark-E25A1C?style=for-the-badge&logo=apachespark&logoColor=white)](https://spark.apache.org/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![ClickHouse](https://img.shields.io/badge/ClickHouse-FFCC00?style=for-the-badge&logo=clickhouse&logoColor=black)](https://clickhouse.com/)

[English Version](./README.md) | [Tiếng Việt](./README-VI.md)

---

## 📌 Giới thiệu dự án

Dự án **Hệ thống giám sát và dự đoán chất lượng không khí IoT đa nền tảng** là một giải pháp end-to-end hoàn chỉnh theo kiến trúc **Microservices** & **Big Data Streaming**. Hệ thống giải quyết bài toán thu thập dữ liệu cảm biến thời gian thực qua giao thức MQTT, xử lý quy mô lớn (ETL) bằng PySpark Streaming, lưu trữ phân tích tốc độ cao trên **ClickHouse OLAP**, đồng bộ thời gian thực sang **Firebase Firestore**, dự báo xu hướng ô nhiễm bằng mô hình học sâu **AI LSTM**, và gửi thông báo cảnh báo ô nhiễm (Push Notification) đến **Mobile App** và **Web Admin Dashboard**.

---

## 🎯 Mục tiêu chính

1. **Xử lý dữ liệu thời gian thực (Real-time Pipeline)**: Tiếp nhận dữ liệu cảm biến qua MQTT (EMQX Broker) mã hóa mTLS, chuyển tiếp sang Kafka topics `air_quality` và xử lý stream bằng PySpark.
2. **Chuẩn hóa & Tính toán AQI**: Tính toán chỉ số AQI theo từng giờ (AQI_H) bao gồm 6 thông số ô nhiễm (CO, NO₂, SO₂, O₃, PM2.5, PM10) và tự động tính `o3_8h_avg` dựa trên 8–12 giờ dữ liệu lịch sử từ ClickHouse.
3. **Phân tích Big Data (OLAP)**: Lưu trữ lịch sử ô nhiễm trên **ClickHouse** (`hoaze.air_quality_analytics` và `hoaze.air_quality_realtime`), cho phép truy vấn báo cáo siêu tốc.
4. **Cảnh báo Thông minh (Smart Notification)**: Khi AQI vượt ngưỡng 100, Spark đẩy message sang Kafka topic `tracking_aqi`. Dịch vụ **Tracking Consumer** sẽ truy vấn MongoDB tìm người dùng ở gần trạm đo nhất và gửi thông báo đẩy **Expo Push Notification** tức thì.
5. **Dự báo ô nhiễm bằng AI**: Sử dụng mô hình **LSTM (Long Short-Term Memory)** đọc 72 giờ dữ liệu gần nhất từ ClickHouse kết hợp mã hóa vòng quay thời gian (Sin/Cos) để dự báo chỉ số AQI cho 24 giờ tiếp theo.
6. **Giao diện đa nền tảng**: Cung cấp **Web Dashboard (Port 4000)** cho quản trị viên và **Mobile App (React Native/Expo)** kết nối Backend API (Port 4001).

---

## 🏗️ Kiến trúc Tổng thể & Luồng dữ liệu (Architecture & Data Flow)

### 1. Sơ đồ Kiến trúc Hệ thống

```text
               +-----------------------------------+
               |  Sensors / Mock Data (node1, 2)   |
               +-----------------------------------+
                                 |
                            (MQTT / SSL)
                                 v
                       +-------------------+
                       |    EMQX Broker    |  <--- CRL Server (Port 3000)
                       +-------------------+
                                 |
                                 v
                       +-------------------+
                       |   Apache Kafka    |  <--- Topics: air_quality, tracking_aqi
                       +-------------------+
                                 |
              +------------------+------------------+
              |                                     |
              v (air_quality)                       v (tracking_aqi)
    +-------------------+                 +-------------------+
    |  Spark Streaming  |                 | Tracking Consumer |
    | (jobs/aqi-job.py) |                 | (kafka_consumer)  |
    +-------------------+                 +-------------------+
              |                                     |
    +---------+---------+                           v
    |                   |                  Expo Push Notification
    v                   v                   & MongoDB Storage
Firestore DB       ClickHouse DB
(Realtime)         (hoaze database)
    |                   |
  +-+--+                v
  |    |        +---------------+
  v    v        |  AI Service   | (LSTM Forecast)
Web   App       | (app.py:5000) |
:4000 :4001     +---------------+
```

### 2. Sơ đồ Luồng Dữ liệu Chi tiết (Data Pipeline Stream)

```text
[ Sensor Node ] ──(MQTT mTLS)──> [ EMQX Broker ] ──> [ Kafka Topic: air_quality ]
                                                             │
                                                             ▼
                                                [ PySpark Streaming Job ]
                                                  (jobs/aqi-job.py)
                                                             │
                   ┌─────────────────────────────────────────┼────────────────────────────────────────┐
                   ▼                                         ▼                                        ▼
      [ Firebase Firestore ]                    [ ClickHouse OLAP DB ]                 [ Kafka Topic: tracking_aqi ]
    (Collection: air_quality)                  (Table: air_quality_realtime)                 (If AQI > 100)
                   │                                         │                                        │
                   ├───────────────┐                         ▼                                        ▼
                   ▼               ▼                 [ AI Service ]                  [ Tracking Consumer ]
               [ Web Admin ]  [ Mobile App ]         (Flask: 5000)                     (MongoDB & Expo Push)
                (Port 4000)    (Port 4001)           Predict 24h AQI
```

---

## ⚙️ Bảng Công nghệ (Technology Stack)

| Phân khu | Công nghệ / Thư viện | Vai trò |
| :--- | :--- | :--- |
| **IoT & Ingestion** | EMQX Broker, OpenSSL, Flask CRL | Thu thập dữ liệu cảm biến thời gian thực, bảo mật TLS 2 chiều (mTLS) |
| **Message Broker** | Apache Kafka, Zookeeper, Kafka UI | Hàng đợi tin nhắn phân tán (Topic: `air_quality`, `tracking_aqi`) |
| **Big Data Processing** | Apache Spark 4.0.1, PySpark | Xử lý ETL stream 30s/trigger, tính toán AQI_H và `o3_8h_avg` |
| **Storage & Database** | ClickHouse, Firebase Firestore, MongoDB, Redis | Database `hoaze` (MergeTree), Realtime Firestore, User/Notification MongoDB |
| **Backend & Web** | Node.js, Express, EJS, Bootstrap, Cloudflare | Web Admin Dashboard (Port 4000), Backend API Mobile (Port 4001) |
| **Mobile App** | React Native, Expo, TypeScript, Expo Notifications | App di động iOS/Android, nhận cảnh báo ô nhiễm |
| **AI / Machine Learning** | Python, TensorFlow/Keras, Joblib, Pandas | Mô hình LSTM dự báo 24h AQI dựa trên 72h dữ liệu |
| **DevOps & Infrastructure**| Docker, Docker Compose, Docker Network | Container hóa riêng theo từng module, chung network `bigdata-network` |

---

## 📁 Cấu trúc Thư mục Dự án (Directory Structure)

```text
AIR_QUALITY/
├── 🤖 AI/                               # Dịch vụ AI dự đoán AQI (Port 5000)
│   ├── app.py                           # Flask API server (/predict endpoint)
│   ├── train/                           # Script & Notebook huấn luyện mô hình LSTM
│   ├── model/                           # Lưu trữ model (.keras) và scaler (.pkl)
│   ├── docker-compose.yml               # Container: flask-ai (Port 5000)
│   └── Dockerfile                       # Python 3.10 + TensorFlow environment
├── 📱 APP_AIR_QUALITY/                  # Ứng dụng di động (React Native / Expo)
│   ├── app/                             # Các màn hình chính (Home, Chart, Alert, Profile)
│   ├── components/                      # Giao diện UI tái sử dụng
│   ├── services/                        # Gọi REST API Backend & Firebase SDK
│   └── package.json                     # Thư viện React Native / Expo
├── ⚙️ BACKEND_APP_AIR_QUALITY/          # Backend RESTful API cho Mobile App (Port 4001)
│   ├── src/                             # Controllers, Routes, Models (User, Notification)
│   ├── app.js                           # Entry point Express API Server
│   ├── docker-compose.yml               # Container: app_air_quality (Port 4001)
│   └── Dockerfile                       # Node.js 18 environment
├── 📊 CLICKHOUSE/                       # Cơ sở dữ liệu phân tích OLAP
│   ├── init.sql                         # Khởi tạo DB `hoaze` & 2 bảng `air_quality_analytics`, `air_quality_realtime`
│   └── docker-compose.yml               # Container: clickhouse (Ports 8123, 9000, 9009)
├── 🛡️ CLOUDFLARE/                       # Public dịch vụ an toàn qua Cloudflare Tunnel
│   └── docker-compose.yml               # Container: cloudflared
├── 🛠️ HELPER/                           # Script bổ trợ & Giả lập cảm biến
│   ├── AQI.py                           # Thuật toán tính toán AQI tiêu chuẩn
│   ├── node1.py / node2.py              # Script mô phỏng 2 trạm đo cảm biến phát dữ liệu MQTT
│   ├── check-status.py                  # Kiểm tra sức khỏe các dịch vụ hệ thống
│   └── notify_admin.py                  # Thông báo cảnh báo cho Admin
├── 📩 KAFKA/                            # Message Broker & Tracking Consumer
│   ├── tracking_consumer/               # Service đọc topic `tracking_aqi` & gửi Expo Push
│   │   ├── kafka_consumer.py            # Entry point Kafka Consumer
│   │   └── utils/                       # Mongo query & Expo push notification helper
│   └── docker-compose.yml               # Containers: zookeeper (2181), kafka1 (9092), kafka2 (9093), kafka-ui (8080), kafka_consumer
├── 📡 MQTT_EMQX/                        # Trạm nhận dữ liệu cảm biến IoT
│   ├── certs/                           # Chứng chỉ SSL/TLS mTLS
│   ├── app.py                           # Server kiểm tra CRL (Certificate Revocation List)
│   └── docker-compose.yml               # Containers: emqx (1883, 8883, 8083, 18083), flask-app (3000)
├── 🍃 MONGODB/                          # Cơ sở dữ liệu MongoDB
│   └── docker-compose.yml               # Container: mongodb (Port 27017), Mongo 8
├── 🔴 REDIS/                            # Bộ nhớ đệm & Lưu trữ phiên Redis
│   └── docker-compose.yml               # Containers: redis (Port 6379), redisinsight (Port 5540)
├── ⚡ SPARK/                            # PySpark Streaming ETL Cluster
│   ├── work-dir/
│   │   ├── google-services.json         # Firebase Admin SDK Credentials
│   │   ├── jobs/
│   │   │   └── aqi-job.py               # Job chính: Kafka -> Spark ETL -> ClickHouse, Firestore & Kafka tracking
│   │   └── utils/                       # Module tính AQI & Kafka producer
│   └── docker-compose.yml               # Containers: spark-master (8082, 7077), spark-worker-1 (cores: 8, mem: 4G)
└── 🌐 WEB_AIR_QUALITY/                  # Web Admin Dashboard (Port 4000)
    ├── src/                             # Routes, Controllers, Views (EJS), Dashboard Charts
    ├── app.js                           # Entry point Express Web Dashboard
    └── docker-compose.yml               # Container: web_air_quality (Port 4000)
```

---

## 🔌 Danh mục Cổng & Container (Service Port Mapping)

| Mô-đun | Tên Container | Cổng Host | Cổng Container | Chức năng / Giao diện |
| :--- | :--- | :--- | :--- | :--- |
| **MQTT EMQX** | `emqx` | `18083`, `8883`, `1883` | `18083`, `8883`, `1883` | EMQX Dashboard (`18083`), Cổng MQTT SSL/TLS (`8883`) |
| **EMQX CRL** | `flask-app` | `3000` | `3000` | Server kiểm tra chứng chỉ bị thu hồi (CRL) |
| **Kafka Cluster** | `kafka1`, `kafka2`, `zookeeper` | `9092`, `9093`, `2181` | `9092`, `2181` | Apache Kafka Brokers & Zookeeper |
| **Kafka UI** | `kafka-ui` | `8080` | `8080` | Giao diện quản lý Kafka Topics (`http://localhost:8080`) |
| **Spark Master**| `spark-master` | `8082`, `7077` | `8080`, `7077` | Spark Web UI (`http://localhost:8082`), Master RPC (`7077`) |
| **Spark Worker**| `spark-worker-1` | - | - | Spark Worker (8 Cores, 4GB RAM) |
| **ClickHouse** | `clickhouse` | `8123`, `9000` | `8123`, `9000` | ClickHouse HTTP (`8123`), Native Client (`9000`) |
| **MongoDB** | `mongodb` | `27017` | `27017` | CSDL lưu trữ Người dùng, Thiết bị, Thông báo (Mongo 8) |
| **Redis** | `redis` | `6379` | `6379` | Bộ nhớ đệm, lưu trữ phiên đăng nhập (Redis 7 Alpine) |
| **RedisInsight** | `redisinsight` | `5540` | `5540` | Giao diện quản lý Redis (`http://localhost:5540`) |
| **AI Service** | `flask-ai` | `5000` | `5000` | REST API dự báo AQI 24h qua mô hình LSTM (`/predict`) |
| **Web Admin** | `web_air_quality` | `4000` | `4000` | Web Dashboard Admin (`http://localhost:4000`) |
| **Mobile Backend**| `app_air_quality` | `4001` | `4001` | RESTful API cho ứng dụng di động (`http://localhost:4001`) |
| **Cloudflare** | `cloudflared` | - | - | Cloudflare Tunnel daemon public dịch vụ an toàn |

---

## 🚀 Hướng dẫn Triển khai & Khởi chạy Chi tiết

### 📋 1. Yêu cầu Tiền đề (Prerequisites)
- **Docker Engine**: `>= 20.10.x` & **Docker Compose**: `>= 2.x`
- **Node.js**: `>= 18.x` (để chạy local Web/Mobile)
- **Python**: `>= 3.10` (để chạy script Helper/AI local)
- **RAM**: Tối thiểu 8GB (khuyên dùng **16GB RAM**)

---

### 🛠️ 2. Triển khai theo thứ tự từng Mô-đun

Tất cả mô-đun kết nối với nhau thông qua mạng Docker chung `bigdata-network`.

#### **Bước 1: Tạo Docker Network chung**
```bash
docker network create bigdata-network
```

#### **Bước 2: Khởi chạy các Dịch vụ Hạ tầng (Infrastructure & Databases)**

1. **Khởi chạy MQTT EMQX Broker**:
   ```bash
   cd MQTT_EMQX && docker-compose up -d && cd ..
   ```
2. **Khởi chạy Kafka Cluster & Consumer**:
   ```bash
   cd KAFKA && docker-compose up -d && cd ..
   ```
3. **Khởi chạy Cơ sở dữ liệu ClickHouse**:
   ```bash
   cd CLICKHOUSE && docker-compose up -d && cd ..
   ```
4. **Khởi chạy MongoDB & Redis**:
   ```bash
   cd MONGODB && docker-compose up -d && cd ..
   cd REDIS && docker-compose up -d && cd ..
   ```
5. **Khởi chạy Cluster Apache Spark**:
   ```bash
   cd SPARK && docker-compose up -d && cd ..
   ```
6. **Khởi chạy Dịch vụ AI (LSTM)**:
   ```bash
   cd AI && docker-compose up -d && cd ..
   ```
7. **Khởi chạy Web Admin Dashboard & Backend Mobile**:
   ```bash
   cd WEB_AIR_QUALITY && docker-compose up -d && cd ..
   cd BACKEND_APP_AIR_QUALITY && docker-compose up -d && cd ..
   ```

---

### 🧪 3. Khởi chạy Job Spark ETL & Giả lập Cảm biến

#### **Bước 1: Khởi chạy Spark Streaming Job**
Mở Terminal và thực thi lệnh khởi chạy job Spark bên trong container `spark-master`:
```bash
docker exec -it spark-master python3 /opt/spark/work-dir/jobs/aqi-job.py
```
> Job sẽ kết nối với Kafka topic `air_quality`, tính toán AQI 30 giây/lần, lưu vào ClickHouse & Firestore.

#### **Bước 2: Giả lập Cảm biến đẩy Dữ liệu (Mock Sensors)**
Mở Terminal khác và chạy script mô phỏng trạm đo cảm biến:
```bash
python HELPER/node1.py
```
Hoặc:
```bash
python HELPER/node2.py
```
Script sẽ sinh các chỉ số CO, NO₂, SO₂, O₃, PM2.5, PM10 và gửi lên EMQX Broker.

---

### 📱 4. Khởi chạy Ứng dụng Di động (Mobile App)

```bash
cd APP_AIR_QUALITY
npm install
npx expo start
```
Sử dụng điện thoại di động mở ứng dụng **Expo Go** và quét mã QR để trải nghiệm app di động real-time.

---

## 🧠 Algorithmic Core & AI Prediction Model

### 1. Quy trình Tính toán AQI Giờ (AQI_H) trong Spark
Spark Streaming Job ([aqi-job.py](./SPARK/work-dir/jobs/aqi-job.py)) thực hiện:
- Nhận luồng dữ liệu thô, loại bỏ các dòng `null`.
- Tính trung bình nồng độ các chất trong cửa sổ thời gian.
- Truy vấn dữ liệu 12 giờ gần nhất từ ClickHouse để có đủ chuỗi tính giá trị trung bình trượt của PM2.5, PM10 và `o3_8h_avg`.
- Tính giá trị AQI thành phần theo thang điểm breakpoint của tiêu chuẩn Việt Nam / US EPA:

$$
\text{AQI}_{\text{Total}} = \max(\text{AQI}_{\text{CO}}, \text{AQI}_{\text{NO2}}, \text{AQI}_{\text{SO2}}, \text{AQI}_{\text{O3}}, \text{AQI}_{\text{PM2.5}}, \text{AQI}_{\text{PM10}})
$$

- Nếu `AQI_Total > 100`, đẩy sự kiện sang topic `tracking_aqi` kích hoạt thông báo push notification.

### 2. Mô hình AI Dự báo (LSTM)
Dịch vụ Flask AI ([app.py](./AI/app.py)) triển khai mô hình:
- **Query ClickHouse**: Lấy 72 giờ dữ liệu gần nhất của `sensor_id` từ bảng `air_quality_analytics`.
- **Feature Engineering**: Tính toán góc quay sinh/cosin của giờ trong ngày:

$$
\text{hour}_{\text{sin}} = \sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \text{hour}_{\text{cos}} = \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right)
$$

- **Dự báo**: Biến đổi dữ liệu thành tensor đầu vào $(1, 72, 3)$, truyền qua mô hình `aqi_model_24h.keras` và trả về mảng 24 giá trị AQI dự báo cho 24 giờ tới (`forecast_24h`).

---

## 📄 Giấy phép (License)

Dự án phục vụ mục đích **nghiên cứu khoa học, học tập và báo cáo kỹ thuật**.
- **License**: MIT License
- **Copyright**: © 2026 Air Quality Monitoring Project.
