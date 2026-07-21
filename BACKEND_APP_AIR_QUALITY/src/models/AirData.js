import mongoose from "mongoose";
const { Schema, model } = mongoose;

const AirDataSchema = new Schema({
  id: { type: String, required: true },
  sensor_id: { type: Number, required: true },
  area: String,
  location_name: String,
  datetimeLocal: Date,
  timezone: String,
  latitude: Number,
  longitude: Number,
  owner_name: String,
  provider: String,
  co_avg: Number,
  no2_avg: Number,
  so2_avg: Number,
  pm25_avg: Number,
  pm10_avg: Number,
  o3_avg: Number,
  o3_8h_avg: Number,
  aqi_co: Number,
  aqi_no2: Number,
  aqi_so2: Number,
  aqi_pm25: Number,
  aqi_pm10: Number,
  aqi_o3: Number,
  aqi_total: Number,
  main_pollutant: String,
  unit: String,
  inserted_at: { type: Date, default: Date.now }
});

// Tạo model
const AirData = model('AirData', AirDataSchema);

export default AirData;
