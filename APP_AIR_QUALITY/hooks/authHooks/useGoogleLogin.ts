import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useLoading } from "../../contexts/LoadingContext";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { loginGoogleService } from "../../services/authService";
import { storage } from "@/configs/storageConfig";
// Hàm cập nhật expo push token
import { registerExpoToken } from "../../hooks/dashboardHooks/useNotification";

export default function useGoogleAuth() {
  const { show, hide } = useLoading();
  const router = useRouter();

  // ==== ĐĂNG NHẬP GOOGLE ====
  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      // Ép popup hiện tài khoản mỗi lần
      await GoogleSignin.signOut();

      // Lấy thống tin tài khoản
      const result = await GoogleSignin.signIn();

      // Nếu thành công thì gửi token lên server
      if (result.type === "success") {
        const idToken: string = result.data.idToken || "";

        // Nếu token rỗng thì dừng ngay
        if (!idToken) {
          Toast.show({
            type: "error",
            text1: "Lỗi xảy ra",
            text2: "Không thể đăng nhập bằng Google",
            visibilityTime: 3000,
          });
          return;
        }

        // Gửi token lên server
        show();
        const { data, res } = await loginGoogleService(idToken);
        hide();

        // Xử lý kết quả trả về từ server
        if (res.status === 200) {
          storage.set("info", JSON.stringify(data.info));
          // Đăng kí token nhận thống báo push
          await registerExpoToken();
          router.replace("/(tabs)/dashboard"); // Chuyển đến trang chủ
        } else if (res.status === 401) {
          // Tài khoảng không hợp lệ
          Toast.show({
            type: "error",
            text1: "Lỗi xảy ra",
            text2: data.error,
            visibilityTime: 3000,
          });
        } else if (res.status === 402) {
          // Tài khoản bị khóa
          Toast.show({
            type: "error",
            text1: "Lỗi xảy ra",
            text2: data.error,
            visibilityTime: 3000,
          });
        } else {
          // Lỗi hệ thống
          Toast.show({
            type: "error",
            text1: "Lỗi server",
            text2: "Lỗi hệ thống vui lòng thử lại sau",
            visibilityTime: 3000,
          });
        }
      }
    } catch (e) {
      console.log("Google login error:", e);
      Toast.show({
        type: "error",
        text1: "Lỗi xảy ra",
        text2: "Không thể đăng nhập bằng Google",
        visibilityTime: 3000,
      });
    }
  };

  // ==== ĐĂNG XUẤT GOOGLE ====
  const signOutGoogle = async () => {
    show(); // Bật loading

    try {
      // Đăng xuất Google
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      // Xóa session trên sever

      return true;
    } catch (e) {
      console.log("Google signout error:", e);
      return false;
    } finally {
      hide(); // Tắt loading
    }
  };

  return { signInWithGoogle, signOutGoogle };
}
