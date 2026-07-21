FROM apache/spark:4.0.1

USER root

# Cài PySpark + Kafka client Python
RUN pip install --no-cache-dir pyspark kafka-python flask clickhouse_connect paho-mqtt pandas pyarrow firebase-admin pymongo

# Cài công cụ hỗ trợ
RUN apt-get update && apt-get install -y --no-install-recommends netcat curl nano && apt-get clean