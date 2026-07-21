import logging
from pymongo import MongoClient
import time
from utils.notification_helper import get_aqi_level, send_expo_push_notification
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv

# --- Load .env ---
load_dotenv()  # tự động đọc file .env trong cùng thư mục

# Lấy múi giờ Việt Nam (Hà Nội/TP.HCM)
tz_vietnam = pytz.timezone('Asia/Ho_Chi_Minh')

# --- ANSI màu ---
class LogColors:
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"

# --- Logging setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# --- Kết nối MongoDB ---
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client.get_database("air_quality")  # hoặc client["dbname"]
users_collection = db["users"]  # tên collection User
notifications_collection = db["notificationaqis"]  # tên collection notification_aqi

# Hàm xử lý tin nhắn kafka 
def handle_kafka_message(value):

    # Lấy thời gian hiện tại
    current_time = time.time() # Thời gian dạng giây

    # Lấy thống tin cơ bản từ kafka
    sensor_id = value["sensor_id"]
    aqi = round(value["aqi"], 2)
    area = value["area"]
    location_name = value["location_name"]

    # Lấy danh sách users quyền User
    users = users_collection.find({
        "role": "User",
        "status": "Active",
        "notification_interval": {"$gt": 0},
        "nearest_sensor_id": {"$ne": None},
        "expo_push_token": {"$ne": None},
        "nearest_sensor_id": sensor_id,
        "notification_status": True,
        "$expr": {
        "$lt": [
            { "$add": ["$last_updated_nearest_sensor", "$notification_interval"] },
            current_time
            ]
        }
    },
       {
        "_id": 1,
        "notification_interval": 1,
        "nearest_sensor_id": 1,
        "status_nearest_sensor": 1,
        "expo_push_token": 1,
        "last_updated_nearest_sensor": 1
    })

    for user in users:
        # Lây expo push notification
        expo_push_token = user["expo_push_token"]

        if not expo_push_token:
            continue

        # Lấy level AQI
        level = get_aqi_level(aqi)

        if not level:
            continue

        # Tạo tiêu đề và nội dung thông báo
        title = f'Cảnh báo chất lượng không khí - AQI mức "{level}"'
        body = f"AQI hiện tại của khu vực {area} - {location_name} là {aqi}."
        content = f'AQI hiện tại của khu vực {area} - {location_name} là "{aqi}" ở mức "{level}".'

        # Gửi notification
        result = send_expo_push_notification(expo_push_token, title, body)
        if result:
            print(f"Đã gửi notification tới user {user['_id']}: {result}")

        # Cập nhật lại last_updated_nearest_sensor
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_updated_nearest_sensor": current_time}}
        )
            
        # Thêm vào collection NotificationAQI
        notifications_collection.insert_one({
            "user_id": user["_id"],
            "sensor_id": sensor_id,
            "aqi": aqi,
            "location": area + " - " + location_name,
            "content": content,
            "read": False,
            "time": datetime.now(tz_vietnam).strftime("%H:%M:%S %d/%m/%Y"),
            "createdAt": datetime.now(tz_vietnam)
        })