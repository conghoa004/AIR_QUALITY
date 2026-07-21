// Hàm lấy thông báo AQI
export async function getNotifications() {
  const res = await fetch(
    process.env.EXPO_PUBLIC_API_URL + "/api/notifications",
    {
      method: "GET",
      credentials: "include",
    }
  );
  const data = await res.json();
  return { data, res };
}

// Hàm cập nhật trạng thái notification
export async function updateNotification(_id: string) {
  const res = await fetch(
    process.env.EXPO_PUBLIC_API_URL + "/api/notifications",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id }),
      credentials: "include",
    }
  );
  const data = await res.json();
  return { data, res };
}

// Xóa tất cả thống báo
export async function deleteAllNotifications() {
  const res = await fetch(
    process.env.EXPO_PUBLIC_API_URL + "/api/notifications",
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  const data = await res.json();
  return { data, res };
}
