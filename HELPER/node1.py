import json
import time
import random
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
import logging

# --- Gửi thông tin node khi kết nối ---
node_info = {
    "sensor_id": 3276359,
    "area": "Quận 1",
    "location_name": "Hồ Chí Minh",
    "datetimeLocal": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"),
    "timezone": "Asia/Ho_Chi_Minh",
    "latitude": 10.776889,
    "longitude": 106.700806,
    "owner_name": "Hoaze",
    "provider": "AirGradient",
    "status": "online"
}

# --- ANSI màu ---
class LogColors:
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

BROKER = "localhost"
PORT = 8883
TOPIC = "node/3276359"
USERNAME = "conghoa"
PASSWORD = "Hoa1234#"

connected = False

def on_connect(client, userdata, flags, rc):
    global connected
    if rc == 0:
        logging.info(f"{LogColors.GREEN}Connected to broker (mTLS){LogColors.RESET}")
        connected = True
    else:
        logging.error(f"{LogColors.RED}Connection failed, rc={rc}{LogColors.RESET}")
        connected = False

# --- Tạo MQTT client ---
client = mqtt.Client(client_id="3276359")
client.username_pw_set(USERNAME, PASSWORD)

# Cấu hình Last Will → broker sẽ tự gửi "offline" khi node ngắt kết nối
node_info["status"] = "offline"
node_info["datetimeLocal"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
client.will_set(
    topic="status/3276359",
    payload=json.dumps(node_info),  # <-- chuyển sang JSON string
    qos=1,
    retain=True
)

# --- Thiết lập mTLS ---
client.tls_set(
    ca_certs="../MQTT_EMQX/certs/rootCA.crt",
    certfile="../MQTT_EMQX/certs/client.crt",
    keyfile="../MQTT_EMQX/certs/client.key"
)

client.on_connect = on_connect

client.connect(BROKER, PORT, 60)
client.loop_start()

try:
    # Chờ kết nối
    timeout = 5
    start_time = time.time()
    while not connected and time.time() - start_time < timeout:
        time.sleep(0.1)

    if connected:
        logging.info(f"{LogColors.YELLOW}Start sending fake air quality data...{LogColors.RESET}")

        # --- Gửi thông tin node khi kết nối thành công ---
        now_local = datetime.now()  # <-- khai báo trước khi dùng

        node_info["status"] = "online"
        node_info["datetimeLocal"] = now_local.strftime("%Y-%m-%dT%H:%M:%S")

        msg = json.dumps(node_info, ensure_ascii=False)
        client.publish("status/3276359", msg, qos=1, retain=True)
        logging.info(f"{LogColors.GREEN}Sent status: online{LogColors.RESET}")

        # --- Gửi dữ liệu đo lường ---
        for i in range(1000):
            now_local = datetime.now()
            data = {
                "sensor_id": 3276359,
                "area": "Quận 1",
                "location_name": "Hồ Chí Minh",
                "datetimeLocal": now_local.strftime("%Y-%m-%dT%H:%M:%S"),
                "timezone": "Asia/Ho_Chi_Minh",
                "latitude": 10.776889,
                "longitude": 106.700806,
                "owner_name": "Hoaze",
                "provider": "AirGradient",
                "co": round(random.uniform(1000, 2500), 2),
                "no2": round(random.uniform(1000, 2000), 2),
                "so2": round(random.uniform(1000, 2000), 2),
                "pm25": round(random.uniform(90, 120), 2),
                "pm10": round(random.uniform(200, 350), 2),
                "o3": round(random.uniform(90, 150), 2),
                "unit": "µg/m³"
            }

            msg = json.dumps(data)
            client.publish(TOPIC, msg)
            logging.info(f"{LogColors.GREEN}Sent to `{TOPIC}`: {msg}{LogColors.RESET}")
            time.sleep(10)

    else:
        logging.error(f"{LogColors.RED}Failed to connect to broker.{LogColors.RESET}")

except KeyboardInterrupt:
    logging.warning(f"{LogColors.RED}Program interrupted by user (Ctrl+C){LogColors.RESET}")
    # gửi offline trước khi disconnect
    node_info["status"] = "offline"
    node_info["datetimeLocal"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    client.publish("status/3276359", json.dumps(node_info), qos=1, retain=True)

finally:
    client.loop_stop()
    client.disconnect()
    logging.info(f"{LogColors.YELLOW}Disconnected from broker{LogColors.RESET}")