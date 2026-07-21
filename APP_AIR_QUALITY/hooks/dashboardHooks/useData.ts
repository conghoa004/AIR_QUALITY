import { useState, useEffect } from "react";
import { getData, listenToRealtimeData, getAQIForecast } from "../../services/dashboardService";
import Toast from "react-native-toast-message";
import { AQIData } from "../../types/dashboardType";

export const useData = (selectAreaID: number) => {
  const [data, setData] = useState<AQIData | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelsAQIForecast, setLabelsAQIForecast] = useState<string[]>([]);
  const [dataAQIForecast, setDataAQIForecast] = useState<number[]>([]);

  // Làm mới dữ liệu
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Call API
  const fetchData = async () => {
    try {
      const { data, res } = await getData(selectAreaID);
      const { dataForecast, resForecast } = await getAQIForecast(selectAreaID.toString());

      if (res.status === 200 && resForecast.status === 200) {
        setData(data.data);
        setLabels(data.labels);
        setDataAQIForecast(dataForecast.forecast_24h);
        setLabelsAQIForecast(dataForecast.labels);
      }

      if (res.status === 402) {
        Toast.show({
          type: "error",
          text1: "Không có dữ liệu",
          text2: data.error,
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Lỗi mạng",
        text2: "Không kết nối được server",
      });
    }
  };

  // Làm mới dữ liệu khi kéo xuống
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Tự dộng làm mới dữ liệu khi có sự thay đổi dữ liệu trên Firebase
  useEffect(() => {
    if (!selectAreaID || selectAreaID <= 0) return;

    let isMoutned = true;

    // Reset dữ liệu
    setData(null);
    setLabels([]);
    fetchData();

    const unsubscribe = listenToRealtimeData(
      selectAreaID.toString(),
      (updatedData) => {
        if (isMoutned) {
          isMoutned = false;
          return;
        }

        if (!updatedData?.datetimeLocal) return;

        // Update data an toàn
        setData((prev) => {
          if (!prev) return prev;

          // Lấy thời gian cập nhật cuối
          const d = new Date(updatedData.datetimeLocal + "Z");

          const last_updated =
            d.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) +
            " " +
            d.toLocaleTimeString("vi-VN", {
              timeZone: "Asia/Ho_Chi_Minh",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

          return {
            ...prev,
            aqi: updatedData.aqi_total,
            pm25: [
              Number(updatedData.aqi_pm25.toFixed(2)),
              ...prev.pm25.slice(1),
            ],
            pm10: [
              Number(updatedData.aqi_pm10.toFixed(2)),
              ...prev.pm10.slice(1),
            ],
            co: [Number(updatedData.aqi_co.toFixed(2)), ...prev.co.slice(1)],
            no2: [Number(updatedData.aqi_no2.toFixed(2)), ...prev.no2.slice(1)],
            so2: [Number(updatedData.aqi_so2.toFixed(2)), ...prev.so2.slice(1)],
            o3: [Number(updatedData.aqi_o3.toFixed(2)), ...prev.o3.slice(1)],
            last_updated: last_updated,
          };
        });

        // Update labels an toàn
        setLabels((prev) => {
          const dateUTC = new Date(updatedData.datetimeLocal + "Z");
          const timeVN = dateUTC.toLocaleTimeString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return [timeVN, ...prev.slice(1)];
        });
      }
    );

    return () => unsubscribe();
  }, [selectAreaID]);

  return {
    data,
    labels,
    dataAQIForecast,
    labelsAQIForecast,
    refreshDataAQI: onRefresh,
    refreshing,
  };
};
