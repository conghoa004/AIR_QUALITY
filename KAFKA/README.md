# Kafka Cluster & MQTT Integration

Dự án này triển khai một cluster Kafka 2 node, Zookeeper và Kafka UI bằng Docker Compose. Đồng thời hỗ trợ kết nối từ MQTT broker (EMQX) tới Kafka thông qua Python producer.

---

## Cấu trúc thư mục

```
MQTT_Kafka/
│   docker-compose.yml
│   Dockerfile-producer
│   emqxsl-ca.crt
│   kafka_consumer.py
│   kafka_producer.py
│   producer.py
│   README.md
```

* `docker-compose.yml` : Cấu hình Zookeeper, Kafka brokers, Kafka UI và optional producer.
* `Dockerfile-producer` : Dockerfile cho producer Python.
* `producer.py` : Script producer nhận MQTT và push lên Kafka.
* `kafka_producer.py`, `kafka_consumer.py` : Ví dụ producer/consumer Python.
* `emqxsl-ca.crt` : Certificate để kết nối MQTT broker TLS.

---

## Yêu cầu

* Docker >= 20.x
* Docker Compose >= 1.29.x
* Python 3.8+ (nếu chạy producer local)
* Network Docker `bigdata-network` đã tạo sẵn:

```bash
docker network create bigdata-network
```

---

## Khởi động Kafka Cluster

1. **Chạy Zookeeper và Kafka brokers**

```bash
docker-compose up -d
```

2. **Kiểm tra các container**

```bash
docker ps
```

Bạn sẽ thấy các container `zookeeper`, `kafka1`, `kafka2`, `kafka-ui` đang chạy.

---

## Truy cập Kafka UI

* Mở trình duyệt: [http://localhost:8080](http://localhost:8080)
* Cluster: `local` với bootstrap servers: `kafka1:29092,kafka2:29092`

---

## Tạo Topic Kafka

**Tạo 2 topic: `tracking_aqi` và `air_quality`**

<video width="800" controls>
  <source src="./docs//craete_topic.mp4" type="video/mp4">
</video>

---