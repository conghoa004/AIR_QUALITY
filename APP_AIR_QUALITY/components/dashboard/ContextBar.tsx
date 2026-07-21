import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { DashboardTheme } from "@/constants/theme";
import Ionicons from "react-native-vector-icons/Ionicons";

interface ContextBarProps {
  selectedArea: string;
  setModalVisible: (visible: boolean) => void;
  onRefreshLocation?: () => void; // callback khi bấm nút refresh
}

const ContextBar: React.FC<ContextBarProps> = ({
  selectedArea,
  setModalVisible,
  onRefreshLocation,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Tiêu đề */}
      <Text style={styles.title}>Chất lượng không khí hiện tại</Text>

      <View style={styles.actions}>
        {/* Nút trở về vị trí trạm cảm biến gần nhất */}
        {onRefreshLocation && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRefreshLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={20} color={DashboardTheme.primary} />
          </TouchableOpacity>
        )}

        {/* Nút chọn khu vực */}
        <TouchableOpacity
          style={styles.areaButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.areaText}>{selectedArea}</Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={DashboardTheme.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ContextBar;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: DashboardTheme.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: DashboardTheme.textSub,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: DashboardTheme.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  areaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: DashboardTheme.secondary,
    borderWidth: 1,
    borderColor: "#D4E2F0",
  },
  areaText: {
    fontSize: 14,
    fontWeight: "700",
    color: DashboardTheme.primary,
    marginRight: 4,
  },
});
