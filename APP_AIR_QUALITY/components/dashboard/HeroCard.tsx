import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { DashboardTheme } from "@/constants/theme";
import { AQIData, AQIEvaluation } from "@/types/dashboardType";

interface HeroCardProps {
  aqiStatus: AQIEvaluation;
  data: AQIData;
  labels: string[];
}

const HeroCard: React.FC<HeroCardProps> = ({ aqiStatus, data, labels }) => {

  return (
    <View style={styles.heroWrapper}>
      <View style={styles.heroCard}>
        <View>
          <Text style={styles.aqiTitle}>Chỉ số AQI</Text>
          <View style={styles.aqiRow}>
            <Text style={[styles.aqiValue, { color: aqiStatus.color }]}>
              {Number(data.aqi).toFixed(2)}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: aqiStatus.bg }]}
            >
              <Text style={[styles.statusText, { color: aqiStatus.color }]}>
                {aqiStatus.level}
              </Text>
            </View>
          </View>
          <Text style={styles.lastUpdate}>Cập nhật lúc {data.last_updated}</Text>
        </View>

        {/* Vòng tròn trạng thái trực quan */}
        <View
          style={[styles.circleRing, { borderColor: aqiStatus.color + "40" }]}
        >
          <View
            style={[styles.circleInner, { backgroundColor: aqiStatus.color }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- HERO CARD ---
  heroWrapper: { padding: 20 },
  heroCard: {
    backgroundColor: DashboardTheme.white,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  aqiTitle: { fontSize: 18, color: DashboardTheme.textSub, fontWeight: "600" },
  aqiRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8 },
  aqiValue: {
    fontSize: 48,
    fontWeight: "800",
    lineHeight: 54,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: { fontWeight: "700", fontSize: 12 },
  lastUpdate: {
    marginTop: 8,
    fontSize: 12,
    color: "#90A4AE",
    fontStyle: "italic",
  },
  circleRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  circleInner: { width: 14, height: 14, borderRadius: 7 },
});

export default HeroCard;
