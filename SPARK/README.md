# SPARK IOT PROJECT

Đây là dự án sử dụng **Apache Spark**, **Python**, và **Docker** để xử lý dữ liệu cảm biến môi trường (AQI, nhiệt độ, độ ẩm...) và lưu kết quả.

---

## Cấu trúc thư mục

```
D:.
│   docker-compose.yml
│   REDME.md
│   
├───CUSTOM-SPARK
│       Dockerfile
│       
├───spark-job
│       Dockerfile
│
└───work-dir
    │   AQI.py
    │   hoaze-225f5-firebase-adminsdk-fbsvc-3691de2a16.json
    │   spark-job.py
    │
    ├───test
    │       app.py
    │       calc_aqi.py
    │       clickhouse.py
    │       spark-job.py
    │       sparkSQL.py
    │       test_spark_2.py
    │       wordCount.py
    │
    └───__pycache__
            *.pyc
```

* `CUSTOM-SPARK/` : Dockerfile tạo image Spark riêng.
* `spark-job/` : Dockerfile để chạy các job Spark.
* `work-dir/` : Chứa mã nguồn Python, config Firebase, và script Spark.
* `docker-compose.yml` : Cấu hình các container Docker.

---

## Yêu cầu

* Docker >= 20.x
* Docker Compose >= 1.29.x
* Python 3.10 (nếu muốn chạy local)
* Java 8+ (Spark cần)

---

## Cài đặt và chạy

1. **Tạo network Docker (nếu chưa có)**

```bash
docker network create bigdata-network
```

2. **Xây dựng Custom Spark Image**

```bash
docker build -t apache/spark-custom:4.0.1 .
```

3. **Khởi động các container với Docker Compose**

```bash
docker-compose up -d
```

> Lệnh này sẽ tạo và chạy các container Spark, mount thư mục `work-dir/` vào container.

4. **Vào container Spark để chạy job**

```bash
docker exec -it <spark-container-name> bash
```

Ví dụ:

```bash
docker exec -it spark-master bash
```

Để thoát chạy lệnh:

```bash
exit
```

5. **Chạy script Python Spark**

```bash
python3 /work-dir/spark-job.py
```

> Lưu ý: đường dẫn `/work-dir` được mount từ host (`work-dir/`).

---

## Submit job Spark

```bash
spark-submit \
  --master spark://spark-master:7077 \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.1 \
  --executor-cores 2 \
  --total-executor-cores 2 \
  writeData.py
```

## Hạn chế tài nguyên cấp phát cho PySpark

```python
spark = SparkSession.builder \
    .appName("SparkQueryAPI") \
    .master("spark://spark-master:7077") \
    .config("spark.driver.cores", 2) \
    .config("spark.driver.memory", "2G") \
    .config("spark.executor.cores", 2) \
    .config("spark.executor.memory", "2G") \
    .config("spark.cores.max", 8) \
    .getOrCreate()
```

---

## Thư viện Python cần cài trong container

* pyspark
* firebase-admin
* clickhouse-connect
* pandas
* numpy

> Bạn có thể thêm vào `Dockerfile` hoặc cài trực tiếp:

```bash
RUN pip install --no-cache-dir pyspark kafka-python flask clickhouse_connect paho-mqtt pandas pyarrow firebase-admin pymongo
```

---

## Cấu hình Firebase

* File `hoaze-225f5-firebase-adminsdk-fbsvc-3691de2a16.json` chứa credential.
* Đảm bảo script Spark (`spark-job.py`) chỉ định đúng đường dẫn tới file này.
* Phải tạo network Docker `bigdata-network` nếu chưa có để các container Spark có thể giao tiếp với nhau.

---

## 🚀 Cách tạo Spark Worker trên máy khác trong cùng mạng LAN

### 📌 Mục tiêu

Kết nối một **Spark Worker** chạy trên **máy thứ 2** vào Spark Master đang chạy trên **máy chính** trong cùng mạng LAN.

---

### 🧱 Bước 1: Chuẩn bị trên máy Worker
- Máy Worker phải:

  - Cùng mạng LAN với máy chạy Spark Master

  - Đã cài Docker và Docker Compose

- Đảm bảo firewall không chặn cổng 7077

---

### 🌐 Bước 2: Lấy địa chỉ IPv4 của máy chạy Spark Master

**🔹 Windows**

```bash
ipconfig
```

**🔹 Linux / macOS**

```bash
ifconfig
```

👉 Tìm dòng IPv4 Address, ví dụ:

```bash
IPv4 Address . . . . . . . . . . : 192.168.1.100
```

📋 **Copy địa chỉ IP này**, sẽ dùng ở bước tiếp theo.

### 🧩 Bước 3: Tạo file `docker-compose.yml` cho Spark Worker

Trên **máy Worker**, tạo file `docker-compose.yml` với nội dung sau:

```yml
version: '3.8'

services:
  spark-worker-2:
    image: apache/spark-custom:4.0.1
    container_name: spark-worker-2
    environment:
      - SPARK_WORKER_CORES=2
      - SPARK_WORKER_MEMORY=2G
      - SPARK_WORKER_PORT=7079
      - SPARK_RPC_AUTHENTICATION_ENABLED=no
      - SPARK_RPC_ENCRYPTION_ENABLED=no
    command: ["/opt/spark/bin/spark-class", "org.apache.spark.deploy.worker.Worker", "spark://<IPv4>:7077"]
    restart: unless-stopped # Luôn khởi động lại nếu lỗi
    volumes:
      - ./work-dir:/opt/spark/work-dir
```

**⚠️ Lưu ý quan trọng**

👉 Thay `192.168.1.100` vào `<IPv4>` của **Spark Master** `spark://<IPv4>:7077`.

### ▶️ Bước 4: Khởi động Spark Worker

Tại thư mục chứa `docker-compose.yml`, chạy:

```bash
docker compose up -d
```

Kiểm tra container có chạy không:

```bash
docker ps
```

### 📊 Bước 5: Kiểm tra Worker đã kết nối thành công chưa

Mở trình duyệt trên **máy Master** và truy cập:

```bash
http://localhost:8082/
```
### ✅ Kết quả mong đợi

- Trong mục **Workers** sẽ thấy:

 - `spark-worker-2`

 - Hiển thị số **CPU Cores, Memory**

 - Trạng thái **ALIVE**
