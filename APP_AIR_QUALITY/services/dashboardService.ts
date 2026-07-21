import { dbFirebase } from "../configs/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

// Hàm lấy thống tin khu vực
export async function getAreaInfo() {
  const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/api/area", {
    method: "GET",
  });
  const data = await res.json();
  return { data, res };
}

// Hàm lấy dữ liệu cho biểu đồ
export async function getData(sensor_id: number) {
  const res = await fetch(
    process.env.EXPO_PUBLIC_API_URL + "/api/data_sensor",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sensor_id: sensor_id }),
    }
  );
  const data = await res.json();
  return { data, res };
}

// Hàm lắng nghe thay đổi dữ liệu realtime từ Firebase
export function listenToRealtimeData(
  documentId: string,
  callback: (data: any | null) => void
) {
  const docRef = doc(dbFirebase, "air_quality", documentId); // tạo doc ref

  // Trả về unsubscribe để hủy listener khi cần
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data()); // gọi callback với dữ liệu mới
    } else {
      callback(null); // gọi callback với null nếu tài liệu không tồn tại
    }
  });

  return unsubscribe;
}

// Hàm lưu token thông báo push lên MongoDB
export async function savePushNotificationToken(token: string) {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ expo_push_token: token }),
    });

    const dataToken = await res.json();
    return { dataToken, res };
  } catch (error) {
    console.log("Lỗi lưu token thông báo push:", error);
  }
}

// Hàm lấy dự đoán AQI 24H tiếp theo
export async function getAQIForecast(sensor_id: string) {
  const resForecast = await fetch(process.env.EXPO_PUBLIC_AI_URL + "/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sensor_id: sensor_id }),
  });
  const dataForecast = await resForecast.json();
  return { dataForecast, resForecast };
}
