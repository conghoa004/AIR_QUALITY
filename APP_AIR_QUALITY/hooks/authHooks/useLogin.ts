import { useState } from "react";
import Toast from "react-native-toast-message";
import { validateEmail, validatePassword } from "../../utils/validateHelper";
import { loginService } from "../../services/authService";
import { useLoading } from "../../contexts/LoadingContext";
import { useRouter } from "expo-router";
import { storage } from "@/configs/storageConfig";
// Hàm cập nhật expo push token
import { registerExpoToken } from "../../hooks/dashboardHooks/useNotification";

export default function useLogin() {
  const [emailError, setEmailError] = useState(""); // Lỗi email
  const [passwordError, setPasswordError] = useState(""); // Lỗi mật khóa
  const { show, hide } = useLoading(); // Hiển thị giao diện loading
  const router = useRouter(); // Dùng để chuyển trang

  // Xử lý login
  const handleLogin = async (email: string, password: string) => {
    // State dùng để hiển thị lỗi
    setEmailError("");
    setPasswordError("");

    // Kiểm tra email và mật khóa
    let isError: boolean = true;

    // Validate
    if (!validateEmail(email)) {
      setEmailError("Email không hợp lệ.");
      isError = false;
    }
    if (!validatePassword(password)) {
      setPasswordError("Mật khẩu không hợp lệ.");
      isError = false;
    }

    if (!isError) return;

    // Call API
    show();
    const { data, res } = await loginService(email, password);
    hide();

    // Đăng nhập thành công
    if (res.status === 200) {
      storage.set("info", JSON.stringify(data.info));
      // Đăng kí token nhận thống báo push
      await registerExpoToken();
      router.replace("/(tabs)/dashboard");
    }

    // Tài khoản không hợp lệ
    else if (res.status === 401) {
      setEmailError("Email không hợp lệ.");
      setPasswordError("Mật khóa không hợp lệ.");
    }

    // Tài khoản bị khóa
    else if (res.status === 402) {
      Toast.show({
        type: "error",
        text1: "Lỗi xảy ra",
        text2: data.error,
        visibilityTime: 3000,
      });
    }

    // Lỗi server
    else {
      Toast.show({
        type: "error",
        text1: "Lỗi server",
        text2: "Vui lý thử lại sau",
        visibilityTime: 3000,
      });
    }
  };

  // Trả về hàm xử lý login và các state lỗi
  return {
    handleLogin,
    emailError,
    passwordError,
    setEmailError,
    setPasswordError,
  };
}
