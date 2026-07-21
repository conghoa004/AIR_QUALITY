import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import React from "react";
import { DashboardTheme } from "@/constants/theme";
import { LineChart } from "react-native-chart-kit";
import { AQIData, ParamType } from "@/types/dashboardType";

// --- CẤU HÌNH CƠ BẢN ---
const { width } = Dimensions.get("window");
const PADDING: number = 20;

interface AQIChartProps {
  selectedParam: ParamType;
  data: AQIData;
  labels: string[];
  description: string;
}

const AQIChart: React.FC<AQIChartProps> = ({
  selectedParam,
  data,
  labels,
  description = "",
}) => {
  const pointSpacing = 70; // khoảng cách giữa các dot
  const chartWidth = Math.max(
    width - PADDING * 2,
    labels.length * pointSpacing
  );

  // Đảm bảo dữ liệu là hợp lệ tránh crash ứng dụng
  const safeChartData = Array.isArray(data?.[selectedParam.key])
    ? data[selectedParam.key]
        .map((v) => Number(v))
        .map((v) => (Number.isFinite(v) ? v : 0))
    : [];

  return (
    <View style={styles.contentSection}>
      <Text style={styles.chartTitle}>
        Biểu đồ {selectedParam.label} {description}
      </Text>
      <View style={styles.chartContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: labels,
              datasets: [
                {
                  data: safeChartData,
                },
              ],
            }}
            width={chartWidth}
            height={260}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#f8faff",
              decimalPlaces: 1,
              color: () => DashboardTheme.primary,
              labelColor: () => "#666666",
              style: { borderRadius: 16 },
              propsForDots: {
                r: "4",
                strokeWidth: "3",
                stroke: DashboardTheme.primary,
                fill: "#ffffff",
              },
              propsForBackgroundLines: {
                stroke: "#e0e0e0",
                strokeDasharray: "6,6",
                strokeWidth: 1,
              },
              fillShadowGradient: DashboardTheme.primary,
              fillShadowGradientOpacity: 0.3,
            }}
            bezier
            withHorizontalLines
            withVerticalLines={false}
            withShadow
            fromZero={false}
            style={{ borderRadius: 16 }}
            renderDotContent={({ x, y, index }) => (
              <Text
                key={index}
                style={{
                  position: "absolute",
                  top: y - 15,
                  left: x - 5,
                  fontSize: 10,
                  color: "white",
                  fontWeight: "600",
                  textAlign: "center",
                  backgroundColor: DashboardTheme.primary,
                  padding: 6,
                  borderRadius: 10,
                }}
              >
                {data[selectedParam.key][index]}
              </Text>
            )}
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default AQIChart;

const styles = StyleSheet.create({
  contentSection: {
    paddingHorizontal: PADDING,
    marginTop: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: DashboardTheme.textMain,
    marginBottom: 15,
    marginLeft: 5,
  },
  chartContainer: {
    backgroundColor: DashboardTheme.white,
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
});
