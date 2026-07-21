import json
import time
import paho.mqtt.client as mqtt
import logging

# --- ANSI màu ---
class LogColors:
    RESET = "\033[0m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"

# --- Cấu hình logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

BROKER = "localhost"
PORT = 8883
TOPIC = "test/topic"
USERNAME = "conghoa"
PASSWORD = "Hoa1234#"

connected = False  # Biến trạng thái kết nối

def on_connect(client, userdata, flags, rc):
    global connected
    if rc == 0:
        logging.info(f"{LogColors.GREEN}Connected to broker (mTLS){LogColors.RESET}")
        connected = True
        client.subscribe(TOPIC)
    else:
        logging.error(f"{LogColors.RED}Connection failed, rc={rc}{LogColors.RESET}")
        connected = False

def on_message(client, userdata, msg):
    logging.info(f"{LogColors.CYAN}Received from `{msg.topic}`: {msg.payload.decode()}{LogColors.RESET}")

client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)

# Kết nối mTLS
client.tls_set(
    ca_certs="./certs/rootCA.crt",
    certfile="./certs/client.crt",
    keyfile="./certs/client.key"
)

client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER, PORT, 60)
client.loop_start()

try:
    # Chờ kết nối
    timeout = 5
    start_time = time.time()
    while not connected and time.time() - start_time < timeout:
        time.sleep(0.1)

    if connected:
        logging.info(f"{LogColors.YELLOW}Start sending data to broker...{LogColors.RESET}")
        for i in range(1000):
            msg = json.dumps({"msg": i})
            client.publish(TOPIC, msg)
            logging.info(f"{LogColors.GREEN}Sent to `{TOPIC}`: {msg}{LogColors.RESET}")
            time.sleep(1)
    else:
        logging.error(f"{LogColors.RED}Failed to connect to broker.{LogColors.RESET}")

except KeyboardInterrupt:
    logging.warning(f"{LogColors.RED}Program interrupted by user (Ctrl+C){LogColors.RESET}")

finally:
    client.loop_stop()
    client.disconnect()
    logging.info(f"{LogColors.CYAN}Disconnected from broker{LogColors.RESET}")