# 🌱 MULTI-PLATFORM IOT AIR QUALITY MONITORING & PREDICTION SYSTEM

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Apache Spark](https://img.shields.io/badge/Apache%20Spark-E25A1C?style=for-the-badge&logo=apachespark&logoColor=white)](https://spark.apache.org/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white)](https://kafka.apache.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/)
[![ClickHouse](https://img.shields.io/badge/ClickHouse-FFCC00?style=for-the-badge&logo=clickhouse&logoColor=black)](https://clickhouse.com/)

[English Version](./README.md) | [Tiếng Việt](./README-VI.md)

---

## 📌 Project Overview

The **Multi-platform IoT Air Quality Monitoring & Prediction System** is a comprehensive end-to-end solution engineered using a **Microservices** and **Big Data Streaming** architecture. The system collects real-time environmental sensor data via MQTT, performs large-scale stream processing (ETL) with PySpark Streaming, stores high-throughput analytical data in **ClickHouse OLAP**, syncs real-time states to **Firebase Firestore**, predicts pollution trends using a **Deep Learning AI (LSTM)** model, and delivers instant push notifications to a **Mobile Application** and **Web Admin Dashboard**.

---

## 🎯 Key Objectives

1. **Real-time Pipeline Processing**: Ingest real-time sensor streams over MQTT (EMQX Broker) secured with mutual TLS (mTLS), route messages to Apache Kafka topics (`air_quality`), and process continuous streams using PySpark.
2. **Data Standardization & AQI Calculation**: Calculate hourly Air Quality Index ($\text{AQI}_{\text{Total}}$) across 6 key pollutants (CO, NO₂, SO₂, O₃, PM2.5, PM10) and compute moving averages (`o3_8h_avg`) based on 8–12 hours of historical ClickHouse data.
3. **Big Data Analytics (OLAP)**: Store massive environmental time-series data in **ClickHouse** (`hoaze.air_quality_analytics` and `hoaze.air_quality_realtime`) for ultra-fast analytical queries.
4. **Smart Alert & Push Notification**: When AQI exceeds 100, Spark triggers events to Kafka topic `tracking_aqi`. A dedicated **Tracking Consumer** queries MongoDB for nearby users and sends real-time **Expo Push Notifications**.
5. **AI Air Quality Forecasting**: Deploy a **Long Short-Term Memory (LSTM)** deep learning model that reads 72 hours of ClickHouse history combined with cyclical time encoding ($\sin/\cos$) to forecast AQI values for the next 24 hours.
6. **Multi-Platform Interfaces**: Provide an administrative **Web Dashboard (Port 4000)** and a cross-platform **Mobile App (React Native/Expo)** backed by a REST API Gateway (Port 4001).

---

## 🏗️ System Architecture & Data Flow

### 1. High-Level System Architecture

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

### 2. End-to-End Data Stream Pipeline

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

## ⚙️ Technology Stack

| Domain | Technology / Libraries | Role / Responsibilities |
| :--- | :--- | :--- |
| **IoT & Ingestion** | EMQX Broker, OpenSSL, Flask CRL | Real-time sensor data ingestion, 2-way TLS (mTLS) security, CRL server |
| **Message Broker** | Apache Kafka, Zookeeper, Kafka UI | Distributed message queues (Topics: `air_quality`, `tracking_aqi`), Cluster UI |
| **Big Data Processing** | Apache Spark 4.0.1, PySpark | 30s micro-batch stream processing, hourly AQI calculation & 8h O₃ moving averages |
| **Storage & Database** | ClickHouse, Firebase Firestore, MongoDB, Redis | MergeTree OLAP storage (`hoaze` DB), Realtime Firestore, MongoDB for Users/Alerts |
| **Backend & Web** | Node.js, Express, EJS, Bootstrap, Cloudflare | Web Admin Dashboard (Port 4000), Mobile REST API (Port 4001), Cloudflare Tunnel |
| **Mobile Application** | React Native, Expo, TypeScript, Expo Notifications | iOS/Android mobile client, real-time AQI monitoring & push notification alerts |
| **AI / Machine Learning** | Python, TensorFlow/Keras, Joblib, Pandas | 24-hour AQI prediction using 72h historical sequence input via LSTM |
| **DevOps & Infrastructure**| Docker, Docker Compose, Docker Network | Modular containerization connected via shared `bigdata-network` |

---

## 📁 Repository Directory Structure

```text
AIR_QUALITY/
├── 🤖 AI/                               # AI Prediction Service (Port 5000)
│   ├── app.py                           # Flask REST API server (/predict endpoint)
│   ├── train/                           # LSTM training scripts & Jupyter notebooks
│   ├── model/                           # Pre-trained models (.keras) & scalers (.pkl)
│   ├── docker-compose.yml               # Container: flask-ai (Port 5000)
│   └── Dockerfile                       # Python 3.10 + TensorFlow environment
├── 📱 APP_AIR_QUALITY/                  # Mobile Application (React Native / Expo)
│   ├── app/                             # Core screens (Home, Chart, Alert, Profile)
│   ├── components/                      # Reusable UI components
│   ├── services/                        # REST API & Firebase integration services
│   └── package.json                     # React Native & Expo dependencies
├── ⚙️ BACKEND_APP_AIR_QUALITY/          # Mobile Backend REST API Gateway (Port 4001)
│   ├── src/                             # Controllers, Routes, Models (User, Notification)
│   ├── app.js                           # Express API Server entry point
│   ├── docker-compose.yml               # Container: app_air_quality (Port 4001)
│   └── Dockerfile                       # Node.js 18 environment
├── 📊 CLICKHOUSE/                       # OLAP Analytical Database Setup
│   ├── init.sql                         # Database `hoaze` & tables (`air_quality_analytics`, `air_quality_realtime`)
│   └── docker-compose.yml               # Container: clickhouse (Ports 8123, 9000, 9009)
├── 🛡️ CLOUDFLARE/                       # Secure Public Access via Cloudflare Tunnel
│   └── docker-compose.yml               # Container: cloudflared
├── 🛠️ HELPER/                           # Utilities & Sensor Simulation Scripts
│   ├── AQI.py                           # Standard AQI calculation algorithm
│   ├── node1.py / node2.py              # Sensor node mock scripts emitting MQTT data
│   ├── check-status.py                  # Health check utility for system services
│   └── notify_admin.py                  # Admin alert notifications helper
├── 📩 KAFKA/                            # Message Broker & Push Notification Consumer
│   ├── tracking_consumer/               # Service consuming `tracking_aqi` & pushing Expo alerts
│   │   ├── kafka_consumer.py            # Kafka Consumer entry point
│   │   └── utils/                       # Mongo query & Expo push notification helper
│   └── docker-compose.yml               # Containers: zookeeper (2181), kafka1 (9092), kafka2 (9093), kafka-ui (8080), kafka_consumer
├── 📡 MQTT_EMQX/                        # IoT Sensor Ingestion Station
│   ├── certs/                           # SSL/TLS mTLS certificates
│   ├── app.py                           # Certificate Revocation List (CRL) server
│   └── docker-compose.yml               # Containers: emqx (1883, 8883, 8083, 18083), flask-app (3000)
├── 🍃 MONGODB/                          # MongoDB Document Database
│   └── docker-compose.yml               # Container: mongodb (Port 27017), Mongo 8
├── 🔴 REDIS/                            # Redis Cache & Session Store
│   └── docker-compose.yml               # Containers: redis (Port 6379), redisinsight (Port 5540)
├── ⚡ SPARK/                            # PySpark Streaming ETL Cluster
│   ├── work-dir/
│   │   ├── google-services.json         # Firebase Admin SDK Credentials
│   │   ├── jobs/
│   │   │   └── aqi-job.py               # Core Job: Kafka -> Spark ETL -> ClickHouse, Firestore & Kafka tracking
│   │   └── utils/                       # AQI calculation & Kafka producer modules
│   └── docker-compose.yml               # Containers: spark-master (8082, 7077), spark-worker-1 (cores: 8, mem: 4G)
└── 🌐 WEB_AIR_QUALITY/                  # Web Admin Dashboard (Port 4000)
    ├── src/                             # Routes, Controllers, Views (EJS), Dashboard Charts
    ├── app.js                           # Express Web Dashboard entry point
    └── docker-compose.yml               # Container: web_air_quality (Port 4000)
```

---

## 🔌 Service Port & Container Mapping

| Module | Container Name | Host Port | Container Port | Service / Web Interface |
| :--- | :--- | :--- | :--- | :--- |
| **MQTT EMQX** | `emqx` | `18083`, `8883`, `1883` | `18083`, `8883`, `1883` | EMQX Management Dashboard (`18083`), MQTT TLS (`8883`) |
| **EMQX CRL** | `flask-app` | `3000` | `3000` | Certificate Revocation List (CRL) Server |
| **Kafka Cluster** | `kafka1`, `kafka2`, `zookeeper` | `9092`, `9093`, `2181` | `9092`, `2181` | Apache Kafka Brokers & Zookeeper |
| **Kafka UI** | `kafka-ui` | `8080` | `8080` | Kafka Management Dashboard (`http://localhost:8080`) |
| **Spark Master**| `spark-master` | `8082`, `7077` | `8080`, `7077` | Spark Web UI (`http://localhost:8082`), Master RPC (`7077`) |
| **Spark Worker**| `spark-worker-1` | - | - | Spark Worker (8 Cores, 4GB RAM) |
| **ClickHouse** | `clickhouse` | `8123`, `9000` | `8123`, `9000` | ClickHouse HTTP (`8123`), Native Client (`9000`) |
| **MongoDB** | `mongodb` | `27017` | `27017` | Document DB for Users, Devices, Notifications (Mongo 8) |
| **Redis** | `redis` | `6379` | `6379` | In-memory cache, session store (Redis 7 Alpine) |
| **RedisInsight** | `redisinsight` | `5540` | `5540` | Redis GUI Management (`http://localhost:5540`) |
| **AI Service** | `flask-ai` | `5000` | `5000` | REST API for 24h LSTM AQI Forecast (`/predict`) |
| **Web Admin** | `web_air_quality` | `4000` | `4000` | Admin Dashboard (`http://localhost:4000`) |
| **Mobile Backend**| `app_air_quality` | `4001` | `4001` | RESTful API Gateway for Mobile App (`http://localhost:4001`) |
| **Cloudflare** | `cloudflared` | - | - | Cloudflare Tunnel daemon for secure external routing |

---

## 🚀 Deployment & Running Instructions

### 📋 1. Prerequisites
- **Docker Engine**: `>= 20.10.x` & **Docker Compose**: `>= 2.x`
- **Node.js**: `>= 18.x` (for local Web/Mobile development)
- **Python**: `>= 3.10` (for local Helper/AI scripts)
- **Minimum RAM**: 8GB (Recommended: **16GB RAM**)

---

### 🛠️ 2. Step-by-Step Module Deployment

All sub-services communicate seamlessly via a shared Docker network named `bigdata-network`.

#### **Step 1: Create Shared Docker Network**
```bash
docker network create bigdata-network
```

#### **Step 2: Start Services per Sub-directory**

1. **Launch MQTT EMQX Broker**:
   ```bash
   cd MQTT_EMQX && docker-compose up -d && cd ..
   ```
2. **Launch Kafka Cluster & Tracking Consumer**:
   ```bash
   cd KAFKA && docker-compose up -d && cd ..
   ```
3. **Launch ClickHouse OLAP Database**:
   ```bash
   cd CLICKHOUSE && docker-compose up -d && cd ..
   ```
4. **Launch MongoDB & Redis**:
   ```bash
   cd MONGODB && docker-compose up -d && cd ..
   cd REDIS && docker-compose up -d && cd ..
   ```
5. **Launch Apache Spark Cluster**:
   ```bash
   cd SPARK && docker-compose up -d && cd ..
   ```
6. **Launch AI Prediction Service (LSTM)**:
   ```bash
   cd AI && docker-compose up -d && cd ..
   ```
7. **Launch Web Admin & Mobile Backend**:
   ```bash
   cd WEB_AIR_QUALITY && docker-compose up -d && cd ..
   cd BACKEND_APP_AIR_QUALITY && docker-compose up -d && cd ..
   ```

---

### 🧪 3. Running Spark Streaming Job & Sensor Simulation

#### **Step 1: Execute Spark Streaming Job**
Open a terminal and execute the Spark job inside the `spark-master` container:
```bash
docker exec -it spark-master python3 /opt/spark/work-dir/jobs/aqi-job.py
```
> The job continuously reads messages from Kafka topic `air_quality`, calculates AQI every 30 seconds, and writes results to ClickHouse and Firestore.

#### **Step 2: Run Sensor Data Simulator (Mock Sensors)**
Open a separate terminal and start mock sensor nodes:
```bash
python HELPER/node1.py
```
Or:
```bash
python HELPER/node2.py
```
The script generates simulated sensor metrics for CO, NO₂, SO₂, O₃, PM2.5, PM10 and publishes them to the EMQX MQTT Broker.

---

### 📱 4. Running the Mobile Application

```bash
cd APP_AIR_QUALITY
npm install
npx expo start
```
Scan the displayed QR code using the **Expo Go** app on an iOS/Android device to experience the real-time mobile interface.

---

## 🧠 Algorithmic Core & AI Prediction Model

### 1. Hourly AQI Calculation (AQI_H) in Spark
The PySpark Streaming Job ([aqi-job.py](./SPARK/work-dir/jobs/aqi-job.py)) performs:
- Ingestion of raw sensor streams and null value filtering.
- Grouping metrics by sensor node and computing average concentrations.
- Querying the past 12 hours of historical ClickHouse data to evaluate rolling averages for PM2.5, PM10, and `o3_8h_avg`.
- Calculating sub-AQI values according to breakpoint standards:

$$
\text{AQI}_{\text{Total}} = \max(\text{AQI}_{\text{CO}}, \text{AQI}_{\text{NO2}}, \text{AQI}_{\text{SO2}}, \text{AQI}_{\text{O3}}, \text{AQI}_{\text{PM2.5}}, \text{AQI}_{\text{PM10}})
$$

- If `AQI_Total > 100`, an event payload is pushed to Kafka topic `tracking_aqi` to trigger user alerts.

### 2. AI Forecasting Model (LSTM)
The Flask AI Service ([app.py](./AI/app.py)) implements:
- **ClickHouse Time-Series Query**: Fetches the last 72 hours of data for a given `sensor_id`.
- **Cyclical Feature Engineering**: Encodes hours into sine and cosine components:

$$
\text{hour}_{\text{sin}} = \sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \text{hour}_{\text{cos}} = \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right)
$$

- **Inference**: Reshapes inputs into tensor $(1, 72, 3)$, runs inference on `aqi_model_24h.keras`, inverse transforms scalers, and returns 24-hour forecasted AQI values (`forecast_24h`).

---

## 📄 License & Attribution

This project is built for **educational, scientific research, and technical reporting purposes**.
- **License**: MIT License
- **Copyright**: © 2026 Air Quality Monitoring Project.
