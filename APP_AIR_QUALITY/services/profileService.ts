// Hàm cập nhật thông tin cá nhân người dùng MongoDB
export async function updateUserProfile(formData: FormData) {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user`, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    return { data, res };
  } catch (error) {
    console.log("Lỗi cập nhật thống tin cá nhân người dùng:", error);
  }
}

// Hàm cập nhật trạm cảm biến gần người dùng nhất
export async function updateUserNearestSensor(nearest_sensor_id: number) {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nearest_sensor_id }),
    });

    const data = await res.json();

    return { data, res };
  } catch (error) {
    console.log("Lỗi cập nhật thống tin cá nhân người dùng:", error);
  }
}

// Hàm cập nhật thời gian gửi thông báo
export async function updateNotificationInterval(
  notification_interval: number
) {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notification_interval }),
    });

    const data = await res.json();

    return { data, res };
  } catch (error) {
    console.log("Lỗi cập nhật thống tin cá nhân người dùng:", error);
  }
}

// Cập nhật bật tắt thòng báo
export async function updateNotificationStatus(notification_status: boolean) {
  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notification_status }),
    });

    const data = await res.json();

    return { data, res };
  } catch (error) {
    console.log("Lỗi cập nhật thống tin cá nhân người dùng:", error);
  }
}
