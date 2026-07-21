import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Header from "@/components/partials/Header";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "@/configs/storageConfig";
import { logoutService } from "@/services/authService";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import LoadingData from "@/components/partials/LoadingData";

function getDataUser() {
  const userInfo = storage.getString("info");
  return userInfo ? JSON.parse(userInfo) : null;
}

const Profile = () => {
  const router = useRouter();

  // Thống tin người dùng
  const [userData, setUserData] = useState(getDataUser());

  // Cập nhật dữ liệu người dùng mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      setUserData(getDataUser());
    }, [])
  );

  if (!userData) return <LoadingData />;

  const infoItems = [
    { label: "ID", value: userData.id },
    { label: "Họ và tên", value: userData.name },
    { label: "Email", value: userData.email },
    { label: "Quyền", value: userData.role },
    { label: "Tạng thái", value: userData.status },
  ];

  const menuItems = [
    {
      icon: "person-outline",
      title: "Chỉnh sửa thông tin",
      color: "#00aaff",
      onPress: () => router.push("/(tabs)/edit_profile"),
    },
    // { icon: "lock-closed-outline", title: "Đổi mật khẩu", color: "#4479e1" },
    // { icon: "settings-outline", title: "Cài đặt ứng dụng", color: "#0096db" },
    {
      icon: "key-outline",
      title: "Điều khoản & Bảo mật",
      color: "#0080a3",
      onPress: () =>
        Linking.openURL("https://iot.hoavan.id.vn/utils/security-and-privacy"),
    },
    {
      icon: "log-out-outline",
      title: "Đăng xuất",
      color: "#e74c3c",
      onPress: () => {
        Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng xuất",
            style: "destructive",
            onPress: async () => {
              const { res } = await logoutService();
              if (res.status === 200) {
                // Xoá hết thông tin người dùng trong storage
                storage.clearAll();
                router.replace("/(tabs)/login");
              }
            },
          },
        ]);
      },
    },
  ];

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header gradient xanh biển đẹp */}
        <LinearGradient
          colors={["#005EB8", "#00aaff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#00c1d6", "#00aaff", "#0088ff"]}
              style={styles.avatarBorder}
            >
              <Image
                source={{
                  uri: userData.avatar,
                }}
                style={styles.avatar}
              />
            </LinearGradient>
          </View>

          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </LinearGradient>

        {/* Phần thông tin (chỉ có Tên và Email) */}
        <View style={styles.infoContainer}>
          {infoItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.infoRow,
                index === infoItems.length - 1 && styles.lastInfoRow,
              ]}
            >
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Menu hành động */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={styles.menuLeft}>
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: item.color + "25" },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.color}
                  />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              {item.title !== "Đăng xuất" && (
                <Ionicons name="chevron-forward" size={22} color="#aaa" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.versionText}>
          Air Quality IoT • Phiên bản 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 24,
  },
  avatarBorder: {
    padding: 5,
    borderRadius: 75,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#005EB8",
    padding: 12,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#fff",
  },
  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  email: {
    fontSize: 17,
    color: "#eee",
    marginTop: 8,
    opacity: 0.95,
  },
  infoContainer: {
    marginHorizontal: 16,
    marginTop: -35,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f7fa",
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: "#607d8b",
  },
  infoValue: {
    fontSize: 16.5,
    color: "#01579b",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  menuContainer: {
    marginHorizontal: 16,
    marginTop: 28,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 22,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0f7fa",
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 17,
    color: "#01579b",
    fontWeight: "500",
  },
  versionText: {
    textAlign: "center",
    color: "#78909c",
    fontSize: 13,
    marginVertical: 35,
  },
});
