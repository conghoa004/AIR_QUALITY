import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Header from "@/components/partials/Header";
import { getAQIEvaluation } from "@/utils/aqiHelper";
import {
  Notification,
  useNotification,
} from "../../hooks/notificationHooks/useNotification";
import { updateNotification } from "../../services/notificationService";
import NotificationSettingsCard from "@/components/notification/NotificationSettingsCard";
import { Alert } from "react-native";
import { deleteAllNotifications } from "../../services/notificationService";

const NotificationsScreen = () => {
  // Dùng hook useNotification
  const { notifications, setNotifications, refreshing, onRefresh } =
    useNotification();

  // State scroll to top
  const listRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Hàm xử lý chưa đọc
  const handlePress = async (_id: string) => {
    // Cập nhật trên server
    await updateNotification(_id);

    // Cập nhật trên client
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === _id ? { ...notif, read: true } : notif
      )
    );
  };

  // Hàm xử lý xoá hết
  const handleDeleteAll = async () => {
    Alert.alert(
      "Xoá tất cả thông báo",
      "Bạn có chắc muốn xoá toàn bộ thông báo không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllNotifications();
              setNotifications([]); // cập nhật UI ngay
            } catch (e) {
              console.log(e);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const evalData = getAQIEvaluation(item.aqi);
    const scaleAnim = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    };

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => handlePress(item._id)}
      >
        {/* Nền màu xanh cho thông báo chưa đọc */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }] },
            !item.read && { backgroundColor: "#e9f2ffff" },
          ]}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                {/* Chấm tròn xanh biển đánh dấu chưa đọc */}
                {!item.read && <View style={styles.unreadDot} />}

                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: evalData.color + "20" },
                  ]}
                >
                  <Text style={[styles.levelText, { color: evalData.color }]}>
                    {evalData.level}
                  </Text>
                </View>
              </View>

              <Text style={styles.timeText}>{item.time}</Text>
            </View>

            <Text style={[styles.title, !item.read && styles.unreadTitle]}>
              {item.content}
            </Text>

            <View style={styles.locationRow}>
              <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={17}
                color="#888"
              />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>

          {/* AQI Circle */}
          <View style={styles.aqiContainer}>
            <View
              style={[styles.aqiCircle, { backgroundColor: evalData.color }]}
            >
              <Text style={styles.aqiNumber}>{item.aqi}</Text>
            </View>
          </View>

          {/* Mũi tên phải */}
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off-outline" size={100} color="#FFD60A" />
      <Text style={styles.emptyTitle}>Không có thống báo hôm nay!</Text>
      <Text style={styles.emptySubtitle}>
        Không có thông báo mới về chất lượng không khí
      </Text>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <Header />

        {/* Danh sách thông báo */}
        <FlatList
          // Hiển thị setting card trên đầu danh sách
          ListHeaderComponent={<NotificationSettingsCard />}
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ref={listRef} // trên đầu trang
          onScroll={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            setShowScrollTop(offsetY > 300); // kéo xuống 300px mới hiện nút
          }}
          scrollEventThrottle={16}
        />

        {/* Nút Xoá tất cả - floating giống nút scroll to top */}
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.deleteAllFloatingButton}
            onPress={handleDeleteAll}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Nút quay về đầu trang */}
        {showScrollTop && (
          <TouchableOpacity
            style={styles.scrollTopButton}
            onPress={() =>
              listRef.current?.scrollToOffset({ offset: 0, animated: true })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#f8f9fc" },
  listContent: { paddingHorizontal: 16, paddingVertical: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginVertical: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
  },
  content: { flex: 1, marginRight: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // khoảng cách giữa chấm tròn và badge
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF", // xanh biển iOS default
  },
  levelBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  levelText: { fontSize: 13.5, fontWeight: "700" },
  timeText: { fontSize: 13.5, color: "#999" },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    lineHeight: 26,
    marginBottom: 10,
  },
  unreadTitle: { fontWeight: "700", color: "#000" },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationText: { fontSize: 15, color: "#64748b", marginLeft: 8 },
  aqiContainer: { justifyContent: "center" },
  aqiCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  aqiNumber: { color: "#fff", fontSize: 16, fontWeight: "800" },
  chevronContainer: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 32,
  },
  emptySubtitle: {
    fontSize: 17,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
  },
  scrollTopButton: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0067d5ff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  // Xóa tất cả
  deleteAllFloatingButton: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#bc0000ff", // đỏ chuẩn Tailwind red-500
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
});

export default NotificationsScreen;
