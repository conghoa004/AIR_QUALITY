import { AQIEvaluation } from "../types/dashboardType";

export const getAQIEvaluation = (aqi: number): AQIEvaluation => {
  if (aqi <= 50) {
    return {
      level: "Tốt",
      color: "#00E400",
      bg: "rgba(0, 228, 0, 0.15)",
      description: "Chất lượng không khí tốt, không ảnh hưởng tới sức khỏe.",
      adviceNormal: "Tự do thực hiện các hoạt động ngoài trời.",
      adviceSensitive: "Tự do thực hiện các hoạt động ngoài trời.",
    };
  }

  if (aqi <= 100) {
    return {
      level: "Trung bình",
      color: "#FFD900",
      bg: "rgba(255, 217, 0, 0.15)",
      description: "Chất lượng không khí ở mức chấp nhận được.",
      adviceNormal: "Tự do thực hiện các hoạt động ngoài trời.",
      adviceSensitive:
        "Nên theo dõi các triệu chứng như ho hoặc khó thở khi hoạt động ngoài trời.",
    };
  }

  if (aqi <= 150) {
    return {
      level: "Kém",
      color: "#FF7E00",
      bg: "rgba(255, 126, 0, 0.15)",
      description: "Những người nhạy cảm có thể gặp vấn đề sức khỏe.",
      adviceNormal:
        "Nếu có triệu chứng đau mắt, ho hoặc đau họng nên giảm hoạt động ngoài trời.",
      adviceSensitive: "Nên giảm các hoạt động mạnh và thời gian ở ngoài trời.",
    };
  }

  if (aqi <= 200) {
    return {
      level: "Xấu",
      color: "#FF0000",
      bg: "rgba(255, 0, 0, 0.15)",
      description: "Chất lượng không khí xấu, bắt đầu ảnh hưởng đến sức khỏe.",
      adviceNormal:
        "Giảm hoạt động mạnh, tránh tập thể dục kéo dài ngoài trời.",
      adviceSensitive:
        "Nên ở trong nhà, nếu ra ngoài hãy đeo khẩu trang đạt chuẩn.",
    };
  }

  if (aqi <= 300) {
    return {
      level: "Rất xấu",
      color: "#8F3F97",
      bg: "rgba(143, 63, 151, 0.15)",
      description: "Cảnh báo ảnh hưởng nghiêm trọng tới sức khỏe.",
      adviceNormal: "Hạn chế tối đa các hoạt động ngoài trời.",
      adviceSensitive: "Nên ở trong nhà và giảm mọi hoạt động thể chất.",
    };
  }

  return {
    level: "Nguy hại",
    color: "#7E0023",
    bg: "rgba(126, 0, 35, 0.15)",
    description: "Cảnh báo khẩn cấp về sức khỏe, toàn bộ dân số bị ảnh hưởng.",
    adviceNormal:
      "Ở trong nhà, đóng kín cửa. Chỉ ra ngoài khi thật sự cần thiết.",
    adviceSensitive:
      "Không ra ngoài, theo dõi sức khỏe và tuân thủ khuyến cáo y tế.",
  };
};
