from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import joblib
import os
from tensorflow.keras.models import load_model
import clickhouse_connect
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# Cho phép CORS
CORS(app)

# ----------------- ClickHouse -----------------
client = clickhouse_connect.get_client(
    host = os.getenv("CLICKHOUSE_HOST"),
    port=os.getenv("CLICKHOUSE_PORT"),
    username=os.getenv("CLICKHOUSE_USER"),
    password=os.getenv("CLICKHOUSE_PASSWORD"),
    database=os.getenv("CLICKHOUSE_DB")
)

# ----------------- Model -----------------
MODEL_DIR = "model"
MODEL_CACHE = {}

def load_model_by_sensor_id(sensor_id):
    if sensor_id in MODEL_CACHE:
        return MODEL_CACHE[sensor_id]

    path = os.path.join(MODEL_DIR, sensor_id)
    model = load_model(os.path.join(path, "aqi_model_24h.keras"))
    scaler = joblib.load(os.path.join(path, "aqi_scaler_24h.pkl"))

    MODEL_CACHE[sensor_id] = (model, scaler)
    return model, scaler

def get_last_72h_data(sensor_id):
    query = """
        SELECT datetimeLocal, aqi_total
        FROM air_quality_analytics
        WHERE sensor_id = %(sensor_id)s
        AND datetimeLocal >= now() - INTERVAL 72 HOUR
        AND datetimeLocal < now()
        ORDER BY datetimeLocal DESC
        LIMIT 72
    """
    df = client.query_df(query, parameters={"sensor_id": sensor_id})

    if len(df) < 72:
        raise ValueError("Không đủ 72 giờ dữ liệu")

    # return df.sort_values("datetimeLocal")
    return df

# ----------------- API -----------------
@app.route("/predict", methods=["POST"])
def predict():
    sensor_id = request.json.get("sensor_id")

    if not sensor_id:
        return jsonify({"error": "Thiếu sensor_id"}), 400

    try:
        # 1. Query dữ liệu
        df = get_last_72h_data(sensor_id)

        # 2. Feature engineering
        df["hour"] = df["datetimeLocal"].dt.hour
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)

        features = df[["aqi_total", "hour_sin", "hour_cos"]].values

        # 3. Load model
        model, scaler = load_model_by_sensor_id(sensor_id)

        scaled = scaler.transform(features)
        X = scaled.reshape(1, 72, 3)

        # 4. Predict
        preds_scaled = model.predict(X)

        # 5. Inverse scale
        forecasts = []
        for i in range(24):
            dummy = np.zeros((1, 3))
            dummy[0, 0] = preds_scaled[0, i]
            aqi = scaler.inverse_transform(dummy)[0, 0]
            forecasts.append(round(float(aqi), 2))

        start_time = df["datetimeLocal"].iloc[0] + pd.Timedelta(hours=1)

        return jsonify({
            "sensor_id": sensor_id,
            "start_time": str(start_time),
            "forecast_24h": forecasts,
            "labels": [(start_time + pd.Timedelta(hours=i)).strftime("%H:%M:%S") for i in range(24)]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)