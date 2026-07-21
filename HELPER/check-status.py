import paho.mqtt.client as mqtt
import logging
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
import json
from notify_admin import *

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

# --- MQTT cấu hình ---
BROKER = "localhost"
PORT = 8883
USERNAME = "conghoa"
PASSWORD = "Hoa1234#"
TOPIC = "status/#"

# --- Firebase Firestore cấu hình ---
cred = credentials.Certificate("./hoaze-225f5-firebase-adminsdk-fbsvc-3691de2a16.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# --- MQTT callback ---
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logging.info(f"{LogColors.GREEN}Connected to MQTT broker (mTLS){LogColors.RESET}")
        client.subscribe(TOPIC)
        logging.info(f"{LogColors.YELLOW}Subscribed to topic: {TOPIC}{LogColors.RESET}")
    else:
        logging.error(f"{LogColors.RED}Connection failed (rc={rc}){LogColors.RESET}")

def on_message(client, userdata, msg):
    topic = msg.topic
    payload_str = msg.payload.decode().strip()
    logging.info(f"{LogColors.GREEN}Received from {topic}: {payload_str}{LogColors.RESET}")

    node_id = topic.split("/")[-1]
    node_ref = db.collection("air_quality").document(node_id)

    try:
        # --- Chuyển payload string thành dict, fallback nếu không phải JSON ---
        payload_dict = json.loads(payload_str)
        print(payload_dict)

        # --- Cập nhật Firestore ---
        node_ref.set(payload_dict, merge=True)
        logging.info(f"{LogColors.YELLOW}Updated Firestore: node {node_id} -> {payload_dict}{LogColors.RESET}")

        # --- Gửi email cảnh báo nếu node offline ---
        if payload_dict.get("status") == "offline":
            notify_admin_node_status(payload_dict)
            logging.info(f"{LogColors.RED}Node {node_id} offline -> admin notified{LogColors.RESET}")

    except Exception as e:
        logging.error(f"{LogColors.RED}Firestore update failed: {e}{LogColors.RESET}")

# --- MQTT setup ---
client = mqtt.Client(client_id="status_subscriber")
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set(
    ca_certs="../MQTT_EMQX/certs/rootCA.crt",
    certfile="../MQTT_EMQX/certs/client.crt",
    keyfile="../MQTT_EMQX/certs/client.key"
)
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)

try:
    logging.info(f"{LogColors.YELLOW}Listening for node status updates...{LogColors.RESET}")
    client.loop_forever()
except KeyboardInterrupt:
    logging.warning(f"{LogColors.RED}Program interrupted by user (Ctrl+C){LogColors.RESET}")
finally:
    client.loop_stop()
    client.disconnect()
    logging.info(f"{LogColors.YELLOW}Disconnected from broker{LogColors.RESET}")