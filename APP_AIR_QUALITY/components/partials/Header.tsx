import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Pressable,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { storage } from "@/configs/storageConfig";
import { useMMKVString } from "react-native-mmkv";
import Icon from "react-native-vector-icons/Ionicons";

type UserInfo = {
  name: string;
  avatar: string;
  email: string;
};

export default function Header() {
  const router = useRouter();

  // Thông tin người dùng
  const [infoRaw] = useMMKVString("info", storage);
  const user: UserInfo = useMemo(() => {
    return infoRaw ? JSON.parse(infoRaw) : null;
  }, [infoRaw]);

  if (!user) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A66C2" />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Text style={styles.logoAir}>Air</Text>
          <Text style={styles.logoQuality}>Quality</Text>
        </View>

        {/* User Area */}
        <Pressable
          style={styles.userArea}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          </View>

          {/* ==== CHỮ XIN CHÀO + TÊN NGƯỜI DÙNG ==== */}
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.welcomeText}>Xin chào,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0A66C2",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },

  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 10,
  },

  // LOGO
  logoWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  logoAir: {
    fontSize: 32,
    fontWeight: "900",
    color: "#00D4FF",
    letterSpacing: -1.2,
  },
  logoQuality: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFB800",
    letterSpacing: -1.2,
    marginLeft: 2,
  },

  // USER AREA
  userArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    maxWidth: "60%",
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "#333",
  },

  // TEXT
  welcomeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginBottom: -2,
  },

  userName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
