# EMQX Certificate Management Tool

Dự án Python này dùng để quản lý **Server certificate**, **CRL** cho EMQX MQTT Broker thông qua `app.py` và để tạo **Root CA** và **Client certificate** bằng `openssl.py`.

---

## Cấu trúc thư mục

```
MQTT_EMQX/
│   app.py
│   client_ext.cnf
│   docker-compose.yml
│   Dockerfile
│   esp32.txt
│   mqtt_test.py
│   openssl.cnf
│   openssl.py
│   README.md
│   scan_ext.cnf
```

* `app.py`: Quản lý Server certificate và CRL.
* `openssl.py`: Tạo Root CA và Client certificate.
* `.cnf`: Các file cấu hình OpenSSL.
* `docker-compose.yml` / `Dockerfile`: Chạy môi trường Docker.
* `mqtt_test.py`: Test kết nối MQTT với certificate.

---

## Yêu cầu

* Python >= 3.8
* OpenSSL cài đặt sẵn trên máy
* Docker

---

## Quy trình cài đặt và chạy

1. **Khởi tạo các thư mục và copy file cấu hình**

```bash
python openssl.py -init
```

* Tạo thư mục `certs/`, `demoCA/`, `config/`
* Copy các file `.cnf` vào `config/`

2. **Tạo Root CA và Client certificate**

```bash
python openssl.py -ca
python openssl.py -server
python openssl.py -client client client1
```

* Mật khẩu mặc định: `12345` (có thể đổi nếu muốn)
* Root CA và Client certificate sẽ được lưu trong `certs/`

3. **Tạo Certificate CRL**

```bash
python openssl.py -crl
```

* CRL: `certs/crl.pem`

4. **Chạy Docker Compose để khởi động container EMQX**

* Tạo network Docker (nếu chưa có)

```bash
docker network create bigdata-network
```

* Chạy docker compose

```bash
docker-compose up -d
```

* Container sẽ mount thư mục `certs/`

5. **Thu hồi Server certificate (nếu cần)**

```bash
python openssl.py -revoke client
```

* Sau đó khởi động lại EMQX:

```bash
docker restart emqx
```

* Để xem các chứng chỉ đã bị thu hồi vào `demoCA/index.txt`

6. **Kiểm tra certificate hoặc CRL**

```bash
python openssl.py -check server.crt
python openssl.py -check crl.pem
python openssl.py -check client.crt
```

---

## Tích hợp với EMQX hoặc MQTT client

* Server certificate và Root CA dùng để cấu hình EMQX.
* Client certificate dùng để kết nối MQTT TLS từ ESP32, Python, hoặc các client khác.
* Xem `mqtt_test.py` để tham khảo cách kết nối MQTT.
* Để test kết nối MQTT, chạy lệnh:

```bash
python mqtt_test.py
```

---

## Truy cập giao diện quản lý EMQX

* Mở trình duyệt và vào: [http://localhost:18083/](http://localhost:18083/)
* Tài khoản mặc định:

  * Username: `admin`
  * Password: `public`

> Lưu ý: Nên đổi mật khẩu mặc định để bảo mật.

---

## Tạo tài khoản để Client để kết nối đến MQTT Broker

<video width="800" controls>
  <source src="./docs/authentication.mp4" type="video/mp4">
</video>

---

## Tạo Kafka Connect

<video width="800" controls>
  <source src="./docs/kafka_connect.mp4" type="video/mp4">
</video>

**Lưu ý sửa SQL Edit thành:**

```bash
SELECT
  *
FROM
  "node/#"
```

---

## Cấu hình cảnh báo hiệu năng EMQX

<video width="800" controls>
  <source src="./docs/performance.mp4" type="video/mp4">
</video>