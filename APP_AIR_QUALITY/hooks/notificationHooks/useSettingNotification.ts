import { storage } from "@/configs/storageConfig";
import {
  updateNotificationInterval,
  updateNotificationStatus,
} from "@/services/profileService";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

// Giá trị giờ hien tại
export const INTERVAL_OPTIONS = [
  { label: "Mỗi 1 giờ", value: 1 },
  { label: "Mỗi 2 giờ", value: 2 },
  { label: "Mỗi 4 giờ", value: 4 },
  { label: "Mỗi 6 giờ", value: 6 },
  { label: "Mỗi 12 giờ", value: 12 },
  { label: "Mỗi 24 giờ", value: 24 },
];

// Hằng chuyển đổi giá trị từ giây sang giờ
const CONVERT_TIME = Number(process.env.EXPO_PUBLIC_CONVERT_TIME) || 30;

const useSettingNotification = () => {
  // --- HOOK Làm mới dữ liệu ---
  useFocusEffect(
    useCallback(() => {
      const newInfo = storage.getString("info");
      const { notification_interval, notification_status } = JSON.parse(
        newInfo || "{}"
      );

      setIsEnabled(Boolean(notification_status) || false);
      setIntervalRaw(notification_interval / CONVERT_TIME + "");
    }, [])
  );

  // --- STATE ---
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [intervalRaw, setIntervalRaw] = useState<string>("1"); // default 1 giờ

  // State giá trị giờ hien tại
  const notificationInterval = useMemo(() => {
    const val = parseInt(intervalRaw || "1");
    return isNaN(val) ? 1 : val;
  }, [intervalRaw]);

  // Nhãn giờ hiện tại
  const currentIntervalLabel =
    INTERVAL_OPTIONS.find((opt) => opt.value === notificationInterval)?.label ||
    "Mỗi 1 giờ";

  // --- MODAL ---
  const [modalVisible, setModalVisible] = useState(false);

  // Xử lý bật tắt switch
  const toggleSwitch = async () => {
    const next = !isEnabled;
    setIsEnabled(next);

    try {
      await updateNotificationStatus(next);
      const oldInfo = JSON.parse(storage.getString("info") || "{}");
      storage.set(
        "info",
        JSON.stringify({
          ...oldInfo,
          notification_status: next,
        })
      );
    } catch (e) {
      setIsEnabled(!next); // rollback
    }
  };

  // Xử lý bật tắt modal
  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  // Xử lý chọn giá trị giờ
  const selectInterval = async (value: number) => {
    setIntervalRaw(value.toString());

    if (isEnabled) {
      const seconds = value * CONVERT_TIME;
      await updateNotificationInterval(seconds);

      const oldInfo = JSON.parse(storage.getString("info") || "{}");
      storage.set(
        "info",
        JSON.stringify({
          ...oldInfo,
          notification_interval: seconds,
        })
      );
    }

    closeModal();
  };

  return {
    isEnabled,
    currentIntervalLabel,
    selectInterval,
    toggleSwitch,
    openModal,
    closeModal,
    modalVisible,
    intervalRaw,
    notificationInterval,
  };
};

export default useSettingNotification;
