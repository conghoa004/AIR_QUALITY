import { useEffect, useState, useRef } from "react";
import { getLocation, findNearestLocation } from "../../utils/locationHelper";
import { storage } from "@/configs/storageConfig";
import { updateUserNearestSensor } from "../../services/profileService";

// --- Kiểu dữ liệu vị trí hiện tại ---
export type LocationData = {
  latitude: number;
  longitude: number;
};

// --- Kiểu dữ liệu sensor ---
export type Sensor = {
  area: string;
  latitude: number;
  longitude: number;
  sensor_id: number;
};

// --- Custom hook ---
export function useLocation(
  sensors: Sensor[],
  setSelectedArea: (area: string) => void,
  setSelectedIdArea: (id: number) => void
) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [nearestSensor, setNearestSensor] = useState<Sensor | null>(null);
  const sensorsRef = useRef<Sensor[]>([]);

  // --- Lấy vị trí hiện tại và tính sensor gần nhất ---
  const updateLocation = async () => {
    try {
      // Lấy vị trí hiện tại
      const loc: LocationData = (await getLocation()) as LocationData;
      setLocation(loc);

      if (!sensors || sensors.length === 0) return;

      // Tìm sensor gần nhất
      const nearest = findNearestLocation(sensors, loc);

      setNearestSensor(nearest);
    } catch (err) {
      console.log("Lỗi lấy vị trí:", err);
    }
  };

  // -- Hàm cập nhật state chọn khu vực ---
  // -- Khi state này cập nhật thì data AQI cũng sẽ tự động cập nhật theo --
  function updateSelectedArea() {
    if (nearestSensor) {
      setSelectedArea(nearestSensor.area);
      setSelectedIdArea(nearestSensor.sensor_id);
    } else {
      // console.log("Không tìm thấy sensor gần nhất.");
    }
  }

  // --- Cập nhật state bên ngoài khi nearestSensor thay đổi ---
  useEffect(() => {
    updateSelectedArea();
  }, [nearestSensor]);

  // --- Lấy vị trí ngay khi hook mount ---
  useEffect(() => {
    updateLocation();
  }, [sensors]);

  // --- Hàm refresh thủ công ---
  const refreshLocation = async () => {
    await updateLocation();
    updateSelectedArea();
  };

  // --- Cập nhật state bên ngoài khi sensors thay đổi ---
  useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  // --- Cập nhật trạm cảm biến gần người dùng nhất lần đầu mở app lên server ---
  const updateNearestSensor = async () => {
    try {
      // Nếu chưa có sensors, bỏ qua
      if (!sensorsRef.current || sensorsRef.current.length === 0) return;

      // Lấy vị trí hiện tại
      const loc: LocationData = (await getLocation()) as LocationData;
      if (loc.latitude == null || loc.longitude == null) return;

      // Tìm sensor gần nhất
      const nearest = findNearestLocation(sensorsRef.current, loc);
      if (!nearest) return;

      // Cập nhật state local
      setNearestSensor(nearest);

      // Gửi lên server
      await updateUserNearestSensor(nearest.sensor_id);

      console.log("Đã cập nhật sensor gần nhất:", nearest.sensor_id);
    } catch (err) {
      console.log("Lỗi khi update nearest sensor:", err);
    }
  };

  // --- Khi hook mount hoặc sensors thay đổi, update nearest sensor lần đầu ---
  useEffect(() => {
    updateNearestSensor();
  }, [sensors]); // sensors có dữ liệu mới sẽ gọi lại

  // --- Bắt đầu gửi vị trí nền ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!storage.getString("info")) return;

      // Lấy vị trí hiện tại
      const loc: LocationData = (await getLocation()) as LocationData;
      if (!loc.latitude || !loc.longitude) return;

      // Tìm sensor gần nhất
      const nearestSensor: Sensor | null = findNearestLocation(
        sensorsRef.current,
        loc
      );

      // Gửi lên server
      try {
        await updateUserNearestSensor(nearestSensor?.sensor_id || 0);
        console.log("Đã cập nhật sensor gần nhất:", nearestSensor?.sensor_id);
      } catch (error) {
        console.log("Lỗi khi update nearest sensor:", error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return { refreshLocation, location, nearestSensor };
}
