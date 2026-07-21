import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
from pymongo import MongoClient

# MongoDB connection
client_mongo = MongoClient("<URL>")  # đổi URL theo DB của bạn
db = client_mongo["smart_house"]
collection_nodes = db["node_status_history"]

ADMIN_EMAIL = "conghoa247@gmail.com"

def notify_admin_node_status(node_data):
    """
    node_data = {
        'sensor_id': 3276359,
        'area': 'Quận 1',
        'location_name': 'Hồ Chí Minh',
        'datetimeLocal': '2025-10-18T00:10:49',
        'timezone': 'Asia/Ho_Chi_Minh',
        'latitude': 10.776,
        'longitude': 106.7,
        'owner_name': 'Hoaze',
        'provider': 'AirGradient',
        'status': 'online'  # hoặc 'offline'
    }
    """
    try:
        status_color = "#28a745" if node_data['status'] == "online" else "#d9534f"  # xanh nếu online, đỏ nếu offline
        status_text = node_data['status'].upper()

        msg = MIMEMultipart("alternative")
        msg['Subject'] = f"Air Quality Alert: Node {node_data['sensor_id']} {status_text}"
        msg['From'] = "conghoa247@gmail.com"
        msg['To'] = ADMIN_EMAIL

        html = f"""
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Air Quality Node Status</title>
            <style>
                body {{
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    background-color: #f2f4f6;
                    margin: 0; padding: 0;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border: 1px solid #e5e7eb;
                }}
                .header {{
                    background-color: {status_color};
                    padding: 20px;
                    text-align: center;
                    color: white;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 24px;
                }}
                .content {{
                    padding: 30px 25px;
                }}
                .content p {{
                    font-size: 16px;
                    color: #555555;
                    line-height: 1.6;
                }}
                .footer {{
                    background-color: #f5f5f5;
                    text-align: center;
                    padding: 15px;
                    font-size: 12px;
                    color: #999999;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 15px;
                }}
                table, th, td {{
                    border: 1px solid #ddd;
                }}
                th, td {{
                    padding: 8px;
                    text-align: left;
                }}
                th {{
                    background-color: #f2f2f2;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Node {node_data['sensor_id']} - {status_text}</h1>
                </div>
                <div class="content">
                    <p>Thông tin chi tiết của node:</p>
                    <table>
                        <tr><th>Sensor ID</th><td>{node_data['sensor_id']}</td></tr>
                        <tr><th>Khu vực</th><td>{node_data['area']}</td></tr>
                        <tr><th>Vị trí</th><td>{node_data['location_name']}</td></tr>
                        <tr><th>Latitude / Longitude</th><td>{node_data['latitude']} / {node_data['longitude']}</td></tr>
                        <tr><th>Trạng thái</th><td>{status_text}</td></tr>
                        <tr><th>Thời gian</th><td>{node_data['datetimeLocal']}</td></tr>
                    </table>
                </div>
                <div class="footer">
                    © 2025 AirQuality. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        """

        part = MIMEText(html, "html")
        msg.attach(part)

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login("conghoa247@gmail.com", "jkkj vlxl sssc vtje")  # phải dùng App Password
            server.sendmail(msg['From'], [msg['To']], msg.as_string())

        logging.info(f"Sent node status email to admin: Node {node_data['sensor_id']} - {status_text}")

        # --- Lưu vào MongoDB ---
        node_record = node_data.copy()
        node_record['createdAt'] = datetime.utcnow()
        collection_nodes.insert_one(node_record)
        logging.info(f"Saved node status to MongoDB: Node {node_data['sensor_id']}")

    except Exception as e:
        logging.error(f"Failed to send node status email: {e}")
