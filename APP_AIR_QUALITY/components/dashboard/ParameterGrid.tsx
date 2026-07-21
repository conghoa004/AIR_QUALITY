import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import React from "react";
import { DashboardTheme } from "@/constants/theme";
import { AQIData, PARAM_TYPES, ParamType } from "@/types/dashboardType";

// Import icon library
import Icon from "react-native-vector-icons/Ionicons";

// --- CẤU HÌNH CƠ BẢN ---
const { width } = Dimensions.get("window");
const PADDING: number = 20;
const ITEM_WIDTH: number = (width - PADDING * 2 - 20) / 3;

// Icon mapping phù hợp nhất cho các chỉ số AQI
const PARAM_ICONS: Record<string, string> = {
  pm25: "cloud-outline",         // Bụi mịn - đám mây mờ/haze (phổ biến nhất)
  pm10: "cloudy-outline",        // Bụi thô - mây dày hơn để phân biệt với PM2.5
  o3: "sunny-outline",           // Ozone - mặt trời
  no2: "car-outline",            // Nitrogen Dioxide - xe cộ/giao thông
  so2: "flame-outline",          // Sulfur Dioxide - lửa/khói công nghiệp
  co: "bonfire-outline",         // Carbon Monoxide - khói/lửa
  // Nếu có thêm chỉ số khác (temperature, humidity,...), thêm ở đây
};

interface ParameterGridProps {
  selectedParam: ParamType;
  data: AQIData;
  setSelectedParam: (param: ParamType) => void;
}

const ParameterGrid: React.FC<ParameterGridProps> = ({
  selectedParam,
  data,
  setSelectedParam,
}) => {
  return (
    <View style={styles.contentSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Chỉ số chi tiết</Text>
        <Text style={styles.sectionSub}>Nhấn để xem biểu đồ</Text>
      </View>

      <View style={styles.gridContainer}>
        {PARAM_TYPES.map((item) => {
          const isSelected = selectedParam.key === item.key;
          const latestValue =
            Number(data[item.key]?.[0])?.toFixed(2) ?? "--";

          const iconName = PARAM_ICONS[item.key] || "alert-circle-outline";

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.gridCard, isSelected && styles.gridCardActive]}
              onPress={() => setSelectedParam(item)}
              activeOpacity={0.8}
            >
              {/* Icon */}
              <Icon
                name={iconName}
                size={30}
                color={isSelected ? "white" : DashboardTheme.primary}
                style={styles.icon}
              />

              <Text
                style={[styles.paramLabel, isSelected && { color: "white" }]}
              >
                {item.label}
              </Text>

              <Text
                style={[styles.paramValue, isSelected && { color: "white" }]}
              >
                {latestValue}
              </Text>

              <Text
                style={[styles.paramUnit, isSelected && { color: "#E3F2FD" }]}
              >
                {item.unit}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default ParameterGrid;

const styles = StyleSheet.create({
  contentSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: DashboardTheme.textMain,
  },
  sectionSub: { fontSize: 12, color: DashboardTheme.textSub, marginBottom: 3 },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: ITEM_WIDTH,
    backgroundColor: DashboardTheme.white,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EFF3F8",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
  },
  gridCardActive: {
    backgroundColor: DashboardTheme.primary,
    borderColor: DashboardTheme.primary,
    elevation: 6,
    shadowColor: DashboardTheme.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    marginBottom: 8,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DashboardTheme.textSub,
    marginBottom: 4,
    textAlign: "center",
  },
  paramValue: {
    fontSize: 20,
    fontWeight: "700",
    color: DashboardTheme.textMain,
  },
  paramUnit: {
    fontSize: 11,
    color: "#90A4AE",
    marginTop: 2,
  },
});