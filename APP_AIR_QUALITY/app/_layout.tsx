import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { LoadingProvider } from "../contexts/LoadingContext";
import { useColorScheme } from "../hooks/systems/use-color-scheme";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as Notifications from "expo-notifications";

// Cấu hình xử lý thông báo khi ứng dụng đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // hiện popup
    shouldPlaySound: true, // phát âm thanh
    shouldSetBadge: false,
    shouldShowBanner: true, // Android/iOS banner
    shouldShowList: true, // iOS notification center
  }),
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Configure Google Sign-in
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_ID,
    offlineAccess: true,
  });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* LoadingProvider */}
      <LoadingProvider>
        <Stack>
          {/* Đây là màn hình root */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        {/* Toast global */}
        <Toast />

        {/* StatusBar */}
        <StatusBar style="auto" />
      </LoadingProvider>
    </ThemeProvider>
  );
}
