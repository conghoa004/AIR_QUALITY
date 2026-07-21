import { useEffect, useState } from "react";
import { registerForPushNotificationsAsync } from "../../utils/registerForPushNotifications";
import { savePushNotificationToken } from "@/services/dashboardService";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Gàm đăng ký token thống báo push
export const registerExpoToken = async () => {
  const token = await registerForPushNotificationsAsync();
  console.log("Push Notification Token:", token);

  if (token) {
    await savePushNotificationToken(token);
  }
};

export function useNotification() {
  useEffect(() => {
    // Cấu hình kênh thông báo cho Android
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
      });
    }
  }, []);
}
