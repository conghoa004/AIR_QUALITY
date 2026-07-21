from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['kafka1:29092', 'kafka2:29092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)