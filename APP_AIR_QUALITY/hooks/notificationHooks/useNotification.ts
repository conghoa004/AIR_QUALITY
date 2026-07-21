import { useState, useEffect } from "react";
import { getNotifications } from "@/services/notificationService";

export type Notification = {
  _id: string;
  content: string;
  aqi: number;
  location: string;
  time: string;
  read: boolean;
};

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Hàm lấy dữ liệu
  const fetchNotifications = async () => {
    const { data, res } = await getNotifications();

    if (res.status === 200) {
      setNotifications(data.notifications);
    } else {
      setNotifications([]);
    }
  };

  // Lấy dữ liệu lần đầu từ server
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Làm mới dữ liệu
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotifications(); // gọi lại API
    } finally {
      setRefreshing(false);
    }
  };

  return { notifications, setNotifications, refreshing, onRefresh };
};
