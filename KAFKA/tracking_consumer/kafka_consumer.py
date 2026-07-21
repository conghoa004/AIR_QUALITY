import sys
import os

# Thêm thư mục cha (project root) vào PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from kafka import KafkaConsumer
import json
import logging
from utils.handle_kafka_message import handle_kafka_message
from dotenv import load_dotenv

# --- Load .env ---
load_dotenv()  # tự động đọc file .env trong cùng thư mục

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

# --- Kafka config từ environment ---
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka1:29092,kafka2:29092").split(",")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "tracking_aqi")
GROUP_ID = os.getenv("GROUP_ID", "tracking_aqi_group")

def main():
    logging.info(f"{LogColors.CYAN}Starting Kafka consumer (BATCH MODE)...{LogColors.RESET}")

    consumer = KafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        group_id=GROUP_ID,
        auto_offset_reset="latest",  # đọc message mới nhất
        enable_auto_commit=True,     # tự động commit offset
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))  # parse JSON bytes -> dict
    )

    try:
        # Đọc kafka message
        for message in consumer:
            handle_kafka_message(message.value)
    except KeyboardInterrupt:
        logging.warning(f"{LogColors.RED}Consumer stopped by user (Ctrl+C){LogColors.RESET}")

    except Exception as e:
        logging.error(f"{LogColors.RED}Error: {e}{LogColors.RESET}")

    finally:
        consumer.close()
        logging.info(f"{LogColors.CYAN}Kafka consumer disconnected.{LogColors.RESET}")

if __name__ == "__main__":
    main()
