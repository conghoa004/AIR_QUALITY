import { DashboardTheme } from "@/constants/theme";
import React from "react";
import {
  Modal,
  TouchableWithoutFeedback,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- CONFIG ---
const { height } = Dimensions.get("window");

// Màu sắc tinh chỉnh
const COLORS = {
  overlay: "rgba(15, 23, 42, 0.65)", // Tối hơn chút để nổi bật Modal
  bg: "#FFFFFF",
  itemBg: "#F8FAFC", // Màu nền mặc định của item (xám rất nhạt)
  activeItemBg: `${DashboardTheme.primary}08`, // Màu nền khi active (8% opacity)
  textMain: "#1E293B",
  textSub: "#64748B",
  border: "#E2E8F0",
};

interface SelectAreaModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  selectIdArea: number;
  setSelectedIdArea: (sensor_id: number) => void;
  selectedArea: string;
  setSelectedArea: (area: string) => void;
  listArea: {
    sensor_id: number;
    area: string;
  }[];
}

export default function SelectAreaModal({
  modalVisible,
  setModalVisible,
  selectIdArea,
  setSelectedIdArea,
  selectedArea,
  setSelectedArea,
  listArea,
}: SelectAreaModalProps) {
  // --- COMPONENT: LOCATION ICON (Thay thế Avatar chữ cái) ---
  const LocationIcon = ({ isActive }: { isActive: boolean }) => (
    <View
      style={[
        styles.iconContainer,
        isActive ? styles.iconActive : styles.iconInactive,
      ]}
    >
      {/* Vẽ Icon Pin đơn giản */}
      <View style={[styles.pinHead, isActive && { backgroundColor: "#fff" }]} />
      <View style={[styles.pinPoint, isActive && { borderTopColor: "#fff" }]} />
    </View>
  );

  // --- COMPONENT: RADIO INDICATOR ---
  const RadioIndicator = ({ isActive }: { isActive: boolean }) => (
    <View
      style={[
        styles.radioCircle,
        { borderColor: isActive ? DashboardTheme.primary : "#CBD5E1" },
        isActive && { backgroundColor: DashboardTheme.primary }, // Active thì tô màu
      ]}
    >
      {isActive && <View style={styles.radioDot} />}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent
          />

          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandleWrapper}>
                <View style={styles.dragHandle} />
              </View>

              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Chọn khu vực</Text>
                  <Text style={styles.subtitle}>
                    Chọn trạm quan sát dữ liệu
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />

              {/* Body List */}
              <FlatList
                data={listArea}
                keyExtractor={(item) => item.sensor_id.toString()} // Đặt key cho FlatList
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isActive = item.area === selectedArea;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.itemCard,
                        isActive && styles.itemCardActive,
                        isActive && { borderColor: DashboardTheme.primary },
                      ]}
                      onPress={() => {
                        setSelectedArea(item.area);
                        setSelectedIdArea(item.sensor_id);
                        setModalVisible(false);
                      }}
                    >
                      {/* Left: Location Icon */}
                      <LocationIcon isActive={isActive} />

                      {/* Center: Text */}
                      <View style={styles.textContainer}>
                        <Text
                          style={[
                            styles.itemText,
                            isActive && {
                              color: DashboardTheme.primary,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {item.area}
                        </Text>
                        {isActive && (
                          <Text style={styles.activeStatusText}>
                            Đang hiển thị
                          </Text>
                        )}
                      </View>

                      {/* Right: Radio */}
                      <RadioIndicator isActive={isActive} />
                    </TouchableOpacity>
                  );
                }}
              />

              <SafeAreaView edges={["bottom"]} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // --- LAYOUT ---
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: height * 0.75,
    // Shadow cho modal chính
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },

  // --- HEADER & DECOR ---
  dragHandleWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: DashboardTheme.textMain,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: "500",
  },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: DashboardTheme.accent,
    borderRadius: 20,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffff",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },

  // --- LIST ITEMS ---
  listContent: {
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: COLORS.itemBg, // Màu nền mặc định nhạt
    borderWidth: 1,
    borderColor: "transparent", // Border trong suốt khi chưa chọn
  },
  itemCardActive: {
    backgroundColor: COLORS.activeItemBg, // Màu nền pha loãng khi Active
    borderColor: "transparent", // Sẽ được override inline
  },

  // TEXT STYLES
  textContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.textMain,
    fontWeight: "600",
  },
  activeStatusText: {
    fontSize: 11,
    color: DashboardTheme.primary,
    fontWeight: "500",
    marginTop: 2,
  },

  // --- LOCATION ICON UI ---
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconInactive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconActive: {
    backgroundColor: DashboardTheme.primary, // Nền màu chủ đạo khi active
    shadowColor: DashboardTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  // Vẽ cái ghim (pin)
  pinHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#94A3B8", // Màu xám khi inactive
  },
  pinPoint: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#94A3B8", // Màu xám khi inactive
    marginTop: -1,
  },

  // --- RADIO INDICATOR UI ---
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
});
