import { Sensor, LocationData } from "@/hooks/dashboardHooks/useLocation";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

// --- Hàm tính khoảng cách Haversine ---
export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Hàm lấy vị trí hiện tại
export const getLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Quyền vị trí bị từ chối",
          text2: "Vui lòng cập nhật quyền vị trí bị từ chối và thử lại.",
          visibilityTime: 3000,
        });
        return;
      }
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const loc: LocationData = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
    return loc;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Hàm tìm ra địa điểm gần user nhất
export const findNearestLocation = (
  sensors: Sensor[],
  loc: LocationData
): Sensor | null => {
  let minDistance = Infinity;
  let nearest: Sensor | null = null;
  sensors.forEach((s: Sensor) => {
    const dist = getDistance(
      loc.latitude,
      loc.longitude,
      s.latitude,
      s.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearest = s;
    }
  });

  return nearest;
};
