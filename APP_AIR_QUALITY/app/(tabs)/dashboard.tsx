import React, { useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from "react-native";
import { DashboardTheme } from "@/constants/theme";
// Import components
import Header from "../../components/partials/Header";
import SelectAreaModal from "@/components/dashboard/SelectAreaModal";
import ContextBar from "@/components/dashboard/ContextBar";
import HeroCard from "@/components/dashboard/HeroCard";
import ParameterGrid from "@/components/dashboard/ParameterGrid";
import AQIChart from "@/components/dashboard/AQIChart";
import LoadingData from "@/components/partials/LoadingData";
import HealthAdviceCard from "@/components/dashboard/HealthAdviceCard";
import AQIForecast24hChart from "@/components/dashboard/AQIForecast24hChart";
// Import hooks
import { useSelectAreaHook } from "@/hooks/dashboardHooks/useSelectArea";
import { useData } from "@/hooks/dashboardHooks/useData";
import { useLocation } from "@/hooks/dashboardHooks/useLocation";
import { useNotification } from "@/hooks/dashboardHooks/useNotification";
// Nạp các hàm tiện ích
import { getAQIEvaluation } from "@/utils/aqiHelper";
// Nạp các interface
import { PARAM_TYPES, AQIEvaluation, ParamType } from "@/types/dashboardType";

// --- COMPONENT CHÍNH ---
export default function AirQualityDashboard() {
  // Kích hoạt thông báo push
  useNotification();

  // Lấy danh sách khu vực và các state liên quan đến modal chọn khu vực
  const {
    listArea, // Danh sách khu vực
    selectedArea, // Khu vực đang chọn
    setSelectedArea, // Cập nhật khu vực đang chọn
    modalVisible, // Modal chọn khu vực visible hay không
    setModalVisible, // Cập nhật modal visible
    selectIdArea, // Id khu vực đang chọn
    setSelectedIdArea, // Cập nhật id khu vực đang chọn
  } = useSelectAreaHook(); // Hook xử lý chọn khu vực

  // Cập nhật khu vực theo vị trí người dùngg
  const { refreshLocation } = useLocation(
    listArea,
    setSelectedArea,
    setSelectedIdArea
  );

  // State biểu đồ
  const [selectedParam, setSelectedParam] = useState<ParamType>(PARAM_TYPES[0]);

  // State dữ liệu chất lượng không khí
  const {
    data,
    labels,
    dataAQIForecast,
    labelsAQIForecast,
    refreshDataAQI,
    refreshing,
  } = useData(selectIdArea);

  // Trạng thái data có dữ liệu hay không
  const isLoading = !data;

  // State trạng thái AQI
  const aqiStatus: AQIEvaluation = !isLoading
    ? getAQIEvaluation(data.aqi)
    : getAQIEvaluation(0);

  // Render component
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DashboardTheme.white}
      />

      {/* HEADER */}
      <Header />

      {/* CONTEXT BAR */}
      <ContextBar
        selectedArea={selectedArea}
        setModalVisible={setModalVisible}
        onRefreshLocation={refreshLocation}
      />

      {/* CONTENT */}
      {isLoading ? (
        <LoadingData />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshDataAQI}
              colors={[DashboardTheme.primary]}
              tintColor={DashboardTheme.primary}
            />
          }
        >
          <HeroCard aqiStatus={aqiStatus} data={data} labels={labels} />
          <HealthAdviceCard aqiStatus={aqiStatus} />
          <ParameterGrid
            selectedParam={selectedParam}
            data={data}
            setSelectedParam={setSelectedParam}
          />
          {/* Biểu đồ AQI 24 gần nhất */}
          <AQIChart
            selectedParam={selectedParam}
            data={data}
            labels={labels}
            description="(24h qua)"
          />
          {/* Biểu đồ dự báo AQI 24h tiếp theo */}
          <AQIForecast24hChart
            labels={labelsAQIForecast}
            aqiData={dataAQIForecast}
          />
        </ScrollView>
      )}

      {/* MODAL */}
      <SelectAreaModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
        listArea={listArea}
        selectIdArea={selectIdArea}
        setSelectedIdArea={setSelectedIdArea}
      />
    </View>
  );
}

// --- STYLESHEET ---
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DashboardTheme.secondary },
});
