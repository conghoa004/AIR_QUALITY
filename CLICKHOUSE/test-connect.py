# Cài thư viện nếu chưa có
# pip install clickhouse-connect==0.7.12

import clickhouse_connect

# Tạo client kết nối ClickHouse
client = clickhouse_connect.get_client(
    host='localhost',       # Nếu chạy Python trên host. Nếu trong Docker network, dùng 'clickhouse'
    port=8123,              # HTTP port ClickHouse
    username='default',
    password='admin',
    database='hoaze'
)

# 1️⃣ Kiểm tra kết nối
try:
    result = client.query("SELECT now()").result_rows
    print("Kết nối thành công, thời gian hiện tại:", result[0][0])
except Exception as e:
    print("Lỗi kết nối:", e)
    exit(1)

# 2️⃣ Tạo bảng air_quality
create_table_query = """
CREATE TABLE IF NOT EXISTS air_quality (
    id UInt32,
    sensor_id String,
    area String,
    location_name String,
    datetimeLocal DateTime,
    temperature Float32,
    humidity Float32
) ENGINE = MergeTree()
ORDER BY id
"""

client.command(create_table_query)
print("Bảng air_quality đã được tạo (nếu chưa tồn tại)")

# 3️⃣ Chèn dữ liệu mẫu
insert_query = """
INSERT INTO air_quality (id, sensor_id, area, location_name, datetimeLocal, temperature, humidity)
VALUES
(1, 'S1', 'Quận 1', 'HCM', now(), 30.5, 70.2),
(2, 'S2', 'Quận 3', 'HCM', now(), 29.0, 65.0)
"""
client.command(insert_query)
print("Dữ liệu mẫu đã được chèn")

# 4️⃣ Query dữ liệu
rows = client.query("SELECT * FROM air_quality").result_rows
print("\nDữ liệu trong bảng air_quality:")
for row in rows:
    print(row)
