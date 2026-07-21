import pandas as pd
import clickhouse_connect
import os

# Tạo client kết nối ClickHouse
client = clickhouse_connect.get_client(
    host='localhost',
    port=8123,
    username='default',
    password='admin',
    database='hoaze'
)

# Kiểm tra kết nối
try:
    result = client.query("SELECT now()").result_rows
    print("Kết nối thành công, thời gian hiện tại:", result[0][0])
except Exception as e:
    print("Lỗi kết nối:", e)
    exit(1)

# Lấy dữ liệu từ ClickHouse
query = """
SELECT sensor_id, area, location_name, aqi_total, datetimeLocal
FROM air_quality_analytics
"""
result = client.query(query)

rows = result.result_rows
columns = result.column_names

# Tạo DataFrame
df = pd.DataFrame(rows, columns=columns)

# Thư mục lưu CSV theo sensor_id
output_dir = "air_quality_by_sensor"
os.makedirs(output_dir, exist_ok=True)

# Lấy danh sách sensor_id duy nhất
sensor_ids = df['sensor_id'].unique()

# Lưu dữ liệu từng sensor_id ra file riêng
for sensor_id in sensor_ids:
    df_sensor = df[df['sensor_id'] == sensor_id]

    filename = os.path.join(output_dir, f"{sensor_id}.csv")
    df_sensor.to_csv(filename, index=False, encoding='utf-8-sig')

    print(f"Đã lưu dữ liệu sensor_id {sensor_id} → {filename}")

print("✅ Hoàn tất xuất CSV theo từng sensor_id.")
