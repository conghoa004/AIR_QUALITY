import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { DashboardTheme } from "@/constants/theme";
import useSettingNotification, {
  INTERVAL_OPTIONS,
} from "@/hooks/notificationHooks/useSettingNotification";

// --- CONFIG ---
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Màu sắc đồng bộ với SelectAreaModal
const COLORS = {
  overlay: "rgba(15, 23, 42, 0.65)",
  bg: "#FFFFFF",
  itemBg: "#F8FAFC",
  activeItemBg: `${DashboardTheme.primary}08`, // 8% opacity
  textMain: "#1E293B",
  textSub: "#64748B",
  border: "#E2E8F0",
};

const NotificationSettingsCard = () => {
  // Dùng hook
  const {
    isEnabled,
    currentIntervalLabel,
    selectInterval,
    toggleSwitch,
    openModal,
    closeModal,
    modalVisible,
    notificationInterval,
  } = useSettingNotification();

  // --- COMPONENT: BELL ICON ---
  const BellIcon = ({ isActive }: { isActive: boolean }) => (
    <View
      style={[
        styles.iconContainer,
        isActive ? styles.iconActive : styles.iconInactive,
      ]}
    >
      <Ionicons
        name="notifications-outline"
        size={24}
        color={isActive ? "#FFFFFF" : "#94A3B8"}
      />
    </View>
  );

  // --- COMPONENT: RADIO INDICATOR ---
  const RadioIndicator = ({ isActive }: { isActive: boolean }) => (
    <View
      style={[
        styles.radioCircle,
        { borderColor: isActive ? DashboardTheme.primary : "#CBD5E1" },
        isActive && { backgroundColor: DashboardTheme.primary },
      ]}
    >
      {isActive && <View style={styles.radioDot} />}
    </View>
  );

  return (
    <>
      {/* === CARD CÀI ĐẶT CHÍNH === */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Cài đặt thông báo</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={DashboardTheme.primary}
            />
            <Text style={styles.settingLabel}>Bật thông báo định kỳ</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: DashboardTheme.primary }}
            thumbColor={isEnabled ? "#FFFFFF" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleSwitch}
            value={isEnabled}
          />
        </View>

        {isEnabled && (
          <TouchableOpacity
            style={styles.intervalPickerRow}
            onPress={openModal}
          >
            <Text style={styles.intervalPickerLabel}>Tần suất gửi</Text>
            <View style={styles.intervalPickerValue}>
              <Text style={styles.intervalPickerText}>
                {currentIntervalLabel}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* === MODAL CHỌN TẦN SUẤT - GIỐNG HỆT SELECT AREA === */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <StatusBar
              backgroundColor="transparent"
              barStyle="light-content"
              translucent
            />

            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                {/* Drag Handle */}
                <View style={styles.dragHandleWrapper}>
                  <View style={styles.dragHandle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.modalTitle}>
                      Chọn tần suất thông báo
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      Thông báo sẽ được gửi định kỳ theo thời gian bạn chọn
                    </Text>
                  </View>

                  <TouchableOpacity onPress={closeModal} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Đóng</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                {/* List Options */}
                <FlatList
                  data={INTERVAL_OPTIONS}
                  keyExtractor={(item) => item.value.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  renderItem={({ item }) => {
                    const isActive = item.value === notificationInterval;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.itemCard,
                          isActive && { backgroundColor: COLORS.activeItemBg },
                        ]}
                        onPress={() => selectInterval(item.value)}
                      >
                        {/* Left: Bell Icon */}
                        <BellIcon isActive={isActive} />

                        {/* Center: Text */}
                        <View style={styles.textContainer}>
                          <Text
                            style={[
                              styles.itemText,
                              isActive && {
                                color: DashboardTheme.primary,
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                          {isActive && (
                            <Text style={styles.activeStatusText}>
                              Đang sử dụng
                            </Text>
                          )}
                        </View>

                        {/* Right: Radio Indicator */}
                        <RadioIndicator isActive={isActive} />
                      </TouchableOpacity>
                    );
                  }}
                />

                <SafeAreaView edges={["bottom"]} />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Card cài đặt chính
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  settingsTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: COLORS.textMain,
    marginBottom: 18,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16.5,
    color: COLORS.textMain,
    fontWeight: "500",
  },
  intervalPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  intervalPickerLabel: {
    fontSize: 16,
    color: "#666",
  },
  intervalPickerValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  intervalPickerText: {
    fontSize: 16,
    fontWeight: "600",
    color: DashboardTheme.primary,
  },

  // Modal - Giống hệt SelectAreaModal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.75,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandleWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: DashboardTheme.textMain,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: "500",
  },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: DashboardTheme.accent,
    borderRadius: 20,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: COLORS.itemBg,
    borderWidth: 1,
    borderColor: "transparent",
  },

  // Icon
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconActive: {
    backgroundColor: DashboardTheme.primary,
    shadowColor: DashboardTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  // Text
  textContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.textMain,
    fontWeight: "600",
  },
  activeStatusText: {
    fontSize: 11,
    color: DashboardTheme.primary,
    fontWeight: "500",
    marginTop: 2,
  },

  // Radio
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
});

export default NotificationSettingsCard;
