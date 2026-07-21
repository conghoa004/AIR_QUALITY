import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { DashboardTheme } from "@/constants/theme";

const { width } = Dimensions.get("window");
const PADDING = 20;

export interface AQIForecast24hChartProps {
  labels: string[]; // mốc thời gian 24h
  aqiData: number[]; // giá trị AQI dự đoán
}

const AQIForecast24hChart: React.FC<AQIForecast24hChartProps> = ({
  labels,
  aqiData,
}) => {
  const pointSpacing = 70;
  const chartWidth = Math.max(
    width - PADDING * 2,
    labels.length * pointSpacing
  );

  // đảm bảo dữ liệu an toàn
  const safeData = Array.isArray(aqiData)
    ? aqiData.map((v) => (Number.isFinite(v) ? v : 0))
    : [];

  return (
    <View style={styles.contentSection}>
      <Text style={styles.chartTitle}>Dự đoán AQI 24 giờ tới</Text>

      <View style={styles.chartContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels,
              datasets: [{ data: safeData }],
            }}
            width={chartWidth}
            height={260}
            bezier
            fromZero
            withVerticalLines={false}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#f8faff",
              decimalPlaces: 0,
              color: () => DashboardTheme.primary,
              labelColor: () => "#666",
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: DashboardTheme.primary,
                fill: "#fff",
              },
              propsForBackgroundLines: {
                stroke: "#e0e0e0",
                strokeDasharray: "6,6",
              },
              fillShadowGradient: DashboardTheme.primary,
              fillShadowGradientOpacity: 0.25,
            }}
            style={{ borderRadius: 16 }}
            renderDotContent={({ x, y, index }) => {
              const labelTop = Math.max(y - 30, 8); // KHÔNG cho lên quá cao

              return (
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
                  {safeData[index]}
                </Text>
              );
            }}
          />
        </ScrollView>
      </View>
    </View>
  );
};

export default AQIForecast24hChart;

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
