import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

export default function usePickImage(setAvatar: (uri: string) => void) {
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  // Chỉ mở thư viện ảnh
  const pickImageFromLibrary = async () => {
    // Yêu cầu quyền truy cập thư viện
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Vui lòng cấp quyền truy cập thư viện ảnh trong Cài đặt để chọn ảnh đại diện."
      );
      return;
    }

    setLoadingAvatar(true);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }

    setLoadingAvatar(false);
  };

  return { pickImageFromLibrary, loadingAvatar };
}
