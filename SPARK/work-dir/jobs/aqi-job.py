import sys
import os

# Thêm thư mục cha (project root) vào PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, udf, avg, first, current_timestamp
from pyspark.sql.types import StructType, StructField, StringType, FloatType, DoubleType, IntegerType, TimestampType, MapType
import clickhouse_connect
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from utils.kafka_producer import producer
from utils.AQI import *
import logging

# ---------------- Logging ----------------
logging.basicConfig(level=logging.INFO)

# ---------------- Cấu hình Firebase ----------------
cred = credentials.Certificate("/opt/spark/work-dir/google-services.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ---------------- ClickHouse ----------------
client = clickhouse_connect.get_client(
    host='clickhouse',
    port=8123,
    user='default',
    password='admin',
    database='hoaze',
    # secure=False, # Set to True if using HTTPS
)

# ---------------- Cấu hình Spark ----------------
spark = SparkSession.builder \
    .appName("AQI-JOB") \
    .master("spark://spark-master:7077") \
    .config("spark.jars.packages", "org.apache.spark:spark-sql-kafka-0-10_2.13:4.0.1") \
    .config("spark.sql.shuffle.partitions", "2") \
    .config("spark.streaming.stopGracefullyOnShutdown", "true") \
    .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
    .config("spark.driver.cores", 2) \
    .config("spark.driver.memory", "1G") \
    .config("spark.executor.cores", 2) \
    .config("spark.executor.memory", "1G") \
    .config("spark.cores.max", 4) \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

# ---------------- Schema ----------------
payload_schema = StructType([
    StructField("sensor_id", IntegerType(), True),
    StructField("area", StringType(), True),
    StructField("location_name", StringType(), True),
    StructField("datetimeLocal", TimestampType(), True),
    StructField("timezone", StringType(), True),
    StructField("latitude", DoubleType(), True),
    StructField("longitude", DoubleType(), True),
    StructField("owner_name", StringType(), True),
    StructField("provider", StringType(), True),
    StructField("co", FloatType(), True),
    StructField("no2", FloatType(), True),
    StructField("so2", FloatType(), True),
    StructField("pm25", FloatType(), True),
    StructField("pm10", FloatType(), True),
    StructField("o3", FloatType(), True),
    StructField("unit", StringType(), True)
])

# ---------------- Đọc Kafka ----------------
df_kafka = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka1:29092,kafka2:29092") \
    .option("subscribe", "air_quality") \
    .option("startingOffsets", "latest") \
    .load()

df_outer = df_kafka.withColumn(
    "outer_json",
    from_json(col("value").cast("string"), MapType(StringType(), StringType()))
)

df_parsed = df_outer.withColumn(
    "data",
    from_json(col("outer_json.payload"), payload_schema)
).select("data.*")

# ---------------- Loại bỏ null ----------------
df_clean = df_parsed.filter(
    col("co").isNotNull() &
    col("no2").isNotNull() &
    col("so2").isNotNull() &
    col("pm25").isNotNull() &
    col("pm10").isNotNull() &
    col("o3").isNotNull()
)

# ---------------- Xử lý trung bình ----------------
df_avg = df_clean.groupBy("sensor_id").agg(
    first("area").alias("area"),
    first("location_name").alias("location_name"),
    first("timezone").alias("timezone"),
    first("latitude").alias("latitude"),
    first("longitude").alias("longitude"),
    first("owner_name").alias("owner_name"),
    first("provider").alias("provider"),
    avg("co").alias("co"),
    avg("no2").alias("no2"),
    avg("so2").alias("so2"),
    avg("pm25").alias("pm25"),
    avg("pm10").alias("pm10"),
    avg("o3").alias("o3"),
    first("unit").alias("unit")
).withColumn("datetimeLocal", current_timestamp())

# ---------------- Xử lý batch ----------------
def process_batch(df, batch_id):
    # Lấy danh sách sensor_id trong batch này
    ids = [row.sensor_id for row in df.select("sensor_id").distinct().collect()]
    if not ids:
        print(f"[Batch {batch_id}] No data in this batch")
        return

    # ---- 1. Lấy dữ liệu 12 giờ gần nhất từ ClickHouse ----
    query = f"""
    SELECT sensor_id, pm25_avg, pm10_avg, o3_avg
    FROM air_quality_analytics
    WHERE sensor_id IN ({','.join(map(str, ids))})
    AND datetimeLocal BETWEEN NOW() - INTERVAL 12 HOUR AND NOW()
    """
    result = client.query(query)
    rows = result.result_rows

    print("Dữ liệu trên ClickHouse: " + str(rows))
    print(f"[Batch {batch_id}] get {len(rows)} rows from ClickHouse")

    # Tạo dict dữ liệu lịch sử: sensor_id -> { "pm25": [...], "pm10": [...], "o3": [...] }
    data_by_sensor = {}
    for sensor_id, pm25_avg, pm10_avg, o3_avg in rows:
        if sensor_id not in data_by_sensor:
            data_by_sensor[sensor_id] = {"pm25": [], "pm10": [], "o3": []}

        data_by_sensor[sensor_id]["pm25"].append(pm25_avg)
        data_by_sensor[sensor_id]["pm10"].append(pm10_avg)
        data_by_sensor[sensor_id]["o3"].append(o3_avg)

    # print("Dữ liệu sau khi xử lý: ", data_by_sensor[3276360]["pm25"])

    # ---- 2. Dữ liệu mới từ Kafka ----
    list_dicts = [r.asDict() for r in df.collect()]
    
    # ---- 3. Tính AQI cho từng sensor ----
    click_house_batch = [] # Dữ liệu sẽ insert với ClickHouse
    firebase_batch = db.batch() # Dữ liệu sẽ insert với Firebase
    for record in list_dicts:
        sid = record["sensor_id"]
        co = record.get("co")
        no2 = record.get("no2")
        o3 = record.get("o3")
        so2 = record.get("so2")

        # Lấy 12 giờ dữ liệu PM25, PM10 và 8 giờ dữ liệu O3
        pm25_data = data_by_sensor.get(sid, {}).get("pm25", [])
        pm10_data = data_by_sensor.get(sid, {}).get("pm10", [])
        o3_data   = data_by_sensor.get(sid, {}).get("o3", [])

        # Bổ sung giá trị mới nhất vào đầu
        pm25_data = ([record.get("pm25")] + pm25_data)[:12]
        pm10_data = ([record.get("pm10")] + pm10_data)[:12]
        o3_data   = ([record.get("o3")] + o3_data)[:8]

        # In 8 dòng dữ liệu o3 gần nhất
        # print("O3_data: ", o3_data)

        # Tìm giá trị trung bình 8h lớn nhất cho O3
        o3_8h_avg = calculate_o3_8h_avg(o3_data)

        # Gọi hàm AQI
        aqi_result = calculate_aqi_hourly(
            co_1h=co,
            no2_1h=no2,
            so2_1h=so2,
            o3_1h=o3,
            pm25_hourly_data=pm25_data,
            pm10_hourly_data=pm10_data
        )

        # Tạo dict dữ liệu
        row_dict = {
            "sensor_id": record["sensor_id"],
            "area": record.get("area"),
            "location_name": record.get("location_name"),
            "datetimeLocal": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "timezone": record.get("timezone"),
            "latitude": record.get("latitude"),
            "longitude": record.get("longitude"),
            "owner_name": record.get("owner_name"),
            "provider": record.get("provider"),
            "co_avg": record.get("co"),
            "no2_avg": record.get("no2"),
            "so2_avg": record.get("so2"),
            "pm25_avg": record.get("pm25"),
            "pm10_avg": record.get("pm10"),
            "o3_avg": record.get("o3"),
            "o3_8h_avg": o3_8h_avg,
            "aqi_co": aqi_result["Details"].get("CO"),
            "aqi_no2": aqi_result["Details"].get("NO2"),
            "aqi_so2": aqi_result["Details"].get("SO2"),
            "aqi_pm25": aqi_result["Details"].get("PM25"),
            "aqi_pm10": aqi_result["Details"].get("PM10"),
            "aqi_o3": aqi_result["Details"].get("O3"),
            "aqi_total": aqi_result["AQI_H"],
            "main_pollutant": aqi_result["Main_Pollutant"],
            "unit": record.get("unit")
        }

        # Ghi dữ liệu vào kafka topic để xử lý thông báo cho người dùng
        try:
            if row_dict["aqi_total"] > 100:    
                # Tạo payload kafka
                kafka_payload = {
                    "sensor_id": row_dict["sensor_id"],
                    "datetimeLocal": row_dict["datetimeLocal"],
                    "aqi": row_dict["aqi_total"],
                    "area": row_dict["area"],
                    "location_name": row_dict["location_name"],
                }

                producer.send(
                    topic="tracking_aqi",
                    key=str(kafka_payload["sensor_id"]).encode(), # Chia partition theo key sensor_id
                    value=kafka_payload
                )
        except Exception as e:
            logging.error(f"Kafka send error sensor {sid}: {e}")

        # ClickHouse batch insert
        click_house_batch.append([
            row_dict['sensor_id'], row_dict['area'], row_dict['location_name'], row_dict['datetimeLocal'],
            row_dict['timezone'], row_dict['latitude'], row_dict['longitude'], row_dict['owner_name'],
            row_dict['provider'], row_dict['co_avg'], row_dict['no2_avg'], row_dict['so2_avg'], row_dict['pm25_avg'],
            row_dict['pm10_avg'], row_dict['o3_avg'], row_dict['o3_8h_avg'], row_dict['aqi_co'], row_dict['aqi_no2'], 
            row_dict['aqi_so2'], row_dict['aqi_pm25'], row_dict['aqi_pm10'], row_dict['aqi_o3'], row_dict['aqi_total'],
            row_dict['main_pollutant'], row_dict['unit']
        ])

        # Firebase batch write
        doc_ref = db.collection("air_quality").document(str(sid))
        firebase_batch.set(doc_ref, row_dict, merge=True)

        # Hiển thị kết quả
        print(f"[Sensor {sid}] AQI_H = {aqi_result['AQI_H']}, "
              f"Main Pollutant: {aqi_result['Main_Pollutant']}, "
              f"Details: {aqi_result['Details']}")
    
    # BẮT BUỘC đẩy hết message đang còn trong buffer ra Kafka broker
    producer.flush()
    
    # --- Ghi ClickHouse ---
    try:
        client.insert(
            'air_quality_realtime',
            click_house_batch,
            column_names=[
                'sensor_id','area','location_name','datetimeLocal','timezone','latitude','longitude',
                'owner_name','provider','co_avg','no2_avg', 'so2_avg','pm25_avg','pm10_avg','o3_avg', 'o3_8h_avg',
                'aqi_co','aqi_no2', 'aqi_so2','aqi_pm25','aqi_pm10','aqi_o3','aqi_total','main_pollutant','unit'
            ]
        )
        logging.info(f"[Batch {batch_id}] Update {len(click_house_batch)} sensor to ClickHouse")
    except Exception as e:
        logging.error(f"[Batch {batch_id}] ClickHouse Error: {e}")

    # --- Ghi Firebase batch ---
    try:
        firebase_batch.commit()
        logging.info(f"[Batch {batch_id}] Update {len(firebase_batch)} sensor to Firebase")
    except Exception as e:
        logging.error(f"[Batch {batch_id}] Firebase Error: {e}")

    logging.info(f"[Batch {batch_id}] Complete batch")

# ---------------- Ghi stream ----------------
query = df_avg.writeStream \
    .outputMode("update") \
    .foreachBatch(process_batch) \
    .option("checkpointLocation", "/tmp/spark_checkpoints/air_quality") \
    .trigger(processingTime="30 seconds") \
    .start()

query.awaitTermination()