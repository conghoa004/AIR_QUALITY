// Các loại chất ô nhiễm không khí
export type PollutantKey = "pm25" | "pm10" | "co" | "no2" | "so2" | "o3";

// Cấu hình hiển thị thông số
export interface ParamType {
  key: PollutantKey;
  label: string;
  unit: string;
}

// Dữ liệu chất lượng không khí
export interface AQIData {
  pm25: number[]; // PM2.5
  pm10: number[]; // PM10
  co: number[]; // CO
  no2: number[]; // NO2
  so2: number[]; // SO2
  o3: number[]; // O3
  aqi: number; // Chỉ số AQI
  last_updated: string;
}

// Cấu hình hiển thị thông số
export const PARAM_TYPES: ParamType[] = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³" },
  { key: "pm10", label: "PM10", unit: "µg/m³" },
  { key: "co", label: "CO", unit: "mg/m³" },
  { key: "no2", label: "NO₂", unit: "µg/m³" },
  { key: "so2", label: "SO₂", unit: "µg/m³" },
  { key: "o3", label: "O₃", unit: "µg/m³" },
] as const;

// Kết quả đánh giá AQI
export interface AQIEvaluation {
  level: string;        // Tốt, Trung bình, Kém...
  color: string;        // màu chính
  bg: string;           // màu nền badge
  description: string;  // mô tả chất lượng không khí
  adviceNormal: string; // khuyến nghị người bình thường
  adviceSensitive: string; // khuyến nghị nhóm nhạy cảm
}
