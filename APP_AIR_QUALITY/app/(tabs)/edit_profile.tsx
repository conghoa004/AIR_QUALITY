import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/partials/Header";
import { storage } from "@/configs/storageConfig";
import { useFocusEffect, useRouter } from "expo-router";
import usePickImage from "@/hooks/systems/usePickImage";
import { updateUserProfile } from "@/services/profileService";
import Toast from "react-native-toast-message";
import { validateName } from "@/utils/validateHelper";

const EditProfile = () => {
  const router = useRouter();
  const userData = JSON.parse(storage.getString("info") || "{}");

  const [name, setName] = useState(userData.name || "");
  const [avatar, setAvatar] = useState(userData.avatar || null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Cập nhật dữ liệu người dùng mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      const latestUser = JSON.parse(storage.getString("info") || "{}");

      setName(latestUser.name || "");
      setAvatar(latestUser.avatar || null);
      setNameError(null);
    }, [])
  );

  const { pickImageFromLibrary, loadingAvatar } = usePickImage(setAvatar);

  const handleSave = async () => {
    if (!validateName(name)) {
      setNameError(
        "Họ tên không hợp lệ. Yêu cầu ít nhất 2 từ và chỉ chứa chữ cái."
      );
      return;
    }
    setNameError(null);

    try {
      const formData = new FormData();
      formData.append("name", name);

      if (avatar && avatar.startsWith("file://")) {
        formData.append("avatar", {
          uri: avatar,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any);
      }

      const result = await updateUserProfile(formData);
      if (!result) return;

      const { res, data } = result;
      if (res.status === 200) {
        const updatedUser = {
          ...userData,
          name,
          avatar: data.updateData.avatar || userData.avatar,
        };
        storage.set("info", JSON.stringify(updatedUser));

        Toast.show({
          type: "success",
          text1: "Cập nhật thông tin thành công!",
        });

        router.replace("/profile");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Lỗi", "Không thể kết nối đến server. Vui lòng thử lại.");
    }
  };

  const infoItems = [
    { label: "ID", value: userData.id || "N/A" },
    { label: "Email", value: userData.email || "N/A" },
    { label: "Quyền", value: userData.role || "User" },
    { label: "Trạng thái", value: userData.status || "Hoạt động" },
  ];

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header với avatar */}
        <LinearGradient colors={["#005EB8", "#00aaff"]} style={styles.header}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#00c1d6", "#00aaff", "#0088ff"]}
              style={styles.avatarBorder}
            >
              <Image
                source={{ uri: avatar || "https://via.placeholder.com/130" }}
                style={styles.avatar}
                defaultSource={{ uri: "https://via.placeholder.com/130" }}
              />
              {loadingAvatar && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </LinearGradient>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={pickImageFromLibrary}
            >
              <Ionicons name="camera" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.nameText}>{name || "Tên người dùng"}</Text>
          <Text style={styles.emailText}>
            {userData.email || "email@domain.com"}
          </Text>
        </LinearGradient>

        {/* Card thông tin */}
        <View style={styles.card}>
          {/* Trường chỉnh sửa tên */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={[styles.textInput, nameError && styles.inputError]}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setNameError(
                  validateName(text)
                    ? null
                    : "Họ tên không hợp lệ. Yêu cầu ít nhất 2 từ và chỉ chứa chữ cái."
                );
              }}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          {/* Các thông tin chỉ xem */}
          {infoItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.infoRow,
                index === infoItems.length - 1 && styles.lastInfoRow,
              ]}
            >
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.valueText}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.versionText}>
          Air Quality IoT • Phiên bản 1.0.0
        </Text>
      </ScrollView>

      {/* Nút hành động cố định dưới cùng */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.replace("/profile")}
        >
          <Text style={styles.cancelText}>Hủy bỏ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButtonWrapper} onPress={handleSave}>
          <LinearGradient
            colors={["#00aaff", "#005EB8"]}
            style={styles.saveButton}
          >
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 60,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  avatarBorder: {
    padding: 5,
    borderRadius: 80,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: { elevation: 15 },
    }),
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: "#ddd",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#005EB8",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  nameText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 8,
  },
  emailText: {
    fontSize: 16,
    color: "#e3f2fd",
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    marginTop: -40,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f7fa",
  },
  label: {
    fontSize: 15,
    color: "#607d8b",
    marginBottom: 8,
  },
  textInput: {
    fontSize: 17,
    color: "#01579b",
    fontWeight: "600",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#00aaff",
  },
  inputError: {
    borderBottomColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    marginTop: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f7fa",
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  valueText: {
    fontSize: 17,
    color: "#01579b",
    fontWeight: "600",
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e3f2fd",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#01579b",
    fontSize: 17,
    fontWeight: "600",
  },
  saveButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  versionText: {
    textAlign: "center",
    color: "#78909c",
    fontSize: 13,
    marginTop: 32,
    marginBottom: 20,
  },
});
