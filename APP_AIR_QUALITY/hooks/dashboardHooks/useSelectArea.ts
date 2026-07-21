import { useEffect, useState, useMemo } from "react";
import { getAreaInfo } from "@/services/dashboardService";
import Toast from "react-native-toast-message";

// Hook xử lý chọn khu vực
export const useSelectAreaHook = () => {
  // List area, selected area, modal visible
  const [listArea, setListArea] = useState<
    { sensor_id: number; area: string; latitude: number; longitude: number }[]
  >([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [selectIdArea, setSelectedIdArea] = useState(-1);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch API
  const fetchData = async () => {
    try {
      // show();
      const { data, res } = await getAreaInfo();

      if (res.status === 200) {
        setListArea(data); // Cập nhật listArea
        // setSelectedArea(data[0].area); // Cập nhật selectedArea (chọn khu vực đầu tiên)
        // setSelectedIdArea(data[0].sensor_id); // Cập nhật selectIdArea (chọn khu vực đầu tiên)
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Lỗi kết nối",
        text2: "Lỗi server.",
      });
    } finally {
      // hide();
    }
  };

  // Lần đầu fetch API
  useEffect(() => {
    fetchData();
  }, []);

  return {
    listArea,
    selectedArea,
    setSelectedArea,
    modalVisible,
    setModalVisible,
    selectIdArea,
    setSelectedIdArea,
    refreshSelectArea: fetchData,
  };
};
