import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { DashboardTheme } from "@/constants/theme";
import { AQIEvaluation } from "@/types/dashboardType";
import { Ionicons } from "@expo/vector-icons";

interface HealthAdviceCardProps {
  aqiStatus: AQIEvaluation;
}

const HealthAdviceCard: React.FC<HealthAdviceCardProps> = ({ aqiStatus }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* Tiêu đề */}
        <View style={styles.header}>
          <View style={styles.titleIcon}>
            <Ionicons name="leaf-outline" size={26} color="#4CAF50" />
          </View>
          <Text style={styles.title}>Tác động đến sức khỏe & Lời khuyên</Text>
        </View>

        <Text style={styles.description}>{aqiStatus.description}</Text>
        <View style={styles.divider} />

        {/* Người bình thường */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.greenCircle}>
              <Ionicons name="person-outline" size={22} color="#4CAF50" />
            </View>
            <Text style={styles.label}>Người bình thường</Text>
          </View>
          <Text style={styles.text}>{aqiStatus.adviceNormal}</Text>
        </View>

        <View style={styles.smallDivider} />

        {/* Nhóm nhạy cảm */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.redCircle}>
              <Ionicons name="heart-outline" size={22} color="#FF5252" />
            </View>
            <Text style={styles.label}>Nhóm nhạy cảm</Text>
          </View>
          <Text style={styles.text}>{aqiStatus.adviceSensitive}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 30 },
  card: {
    backgroundColor: DashboardTheme.white,
    borderRadius: 28,
    padding: 20,
    shadowColor: DashboardTheme.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  titleIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#1B5E20" },
  description: {
    fontSize: 16,
    color: "#37474F",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#B0BEC5",
    opacity: 0.4,
    marginVertical: 16,
  },
  smallDivider: {
    height: 1,
    backgroundColor: "#CFD8DC",
    opacity: 0.5,
    marginVertical: 18,
  },
  section: { marginBottom: 2 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  greenCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  redCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#263238",
    marginLeft: 14,
  },
  text: { fontSize: 15, color: "#455A64", lineHeight: 22, marginLeft: 52 },
});

export default HealthAdviceCard;
