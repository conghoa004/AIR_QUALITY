# Dockerfile trong tracking_consumer/
FROM python:3.10-slim

WORKDIR /app

# Copy requirements từ cùng thư mục Dockerfile
COPY requirements.txt .

# Cài đặt thư viện
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code
COPY . .

# Chạy consumer
CMD ["python", "kafka_consumer.py"]