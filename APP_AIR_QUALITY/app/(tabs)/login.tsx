import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useGoogleAuth from "../../hooks/authHooks/useGoogleLogin";
import useLogin from "../../hooks/authHooks/useLogin";
import { useFocusEffect } from "expo-router";

// Function component
export default function LoginScreen() {
  const [email, setEmail] = useState(""); // State email
  const [password, setPassword] = useState(""); // State password
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithGoogle } = useGoogleAuth(); // Hook đăng nhập google
  const {
    handleLogin,
    emailError,
    passwordError,
    setEmailError,
    setPasswordError,
  } = useLogin(); //Hook đăng nhập tài khoản

  // Làm mới dữ liệu khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      setEmail("");
      setPassword("");
      setEmailError("");
      setPasswordError("");
    }, [])
  );

  // Render UI
  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && {
                transform: [{ translateY: 6 }],
                shadowOpacity: 0.25,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                <Text style={{ color: "#00D4FF" }}>Air</Text>
                <Text style={{ color: "#FFB800" }}>Quality</Text>
              </Text>
              <Text style={styles.subtitle}>
                Đăng nhập hệ thống Air Quality
              </Text>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  { paddingRight: 50 },
                  passwordError ? styles.inputError : null,
                ]}
                placeholder="Mật khẩu"
                placeholderTextColor="#888"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>

              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            {/* Quên mật khẩu */}
            <TouchableOpacity
              style={styles.forgot}
              onPress={() => Linking.openURL("https://iot.hoavan.id.vn/auth/forgot-password")}
            >
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Nút Đăng nhập chính */}
            <TouchableOpacity
              onPress={async () => await handleLogin(email, password)}
              activeOpacity={0.85}
            >
              <View style={styles.loginBtn}>
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>HOẶC</Text>
              <View style={styles.line} />
            </View>

            {/* Nút Google ĐẸP NHƯ WEB 100% */}
            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && styles.googleBtnPressed,
              ]}
              onPress={() => signInWithGoogle()}
            >
              <Image
                source={{ uri: "https://www.google.com/favicon.ico" }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleText}>SignIn with Google</Text>
            </Pressable>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#0060c0ff",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 50,
    paddingHorizontal: 36,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 15.5,
    color: "#6c757d",
    marginTop: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  input: {
    height: 58,
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputError: {
    borderColor: "#e63946", // đỏ
  },
  errorText: {
    color: "#e63946",
    marginTop: 6,
    fontSize: 13,
    marginLeft: 4,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 17,
  },
  forgot: {
    alignSelf: "flex-end",
    marginBottom: 28,
  },
  forgotText: {
    color: "#004487",
    fontSize: 14.5,
    fontWeight: "600",
  },
  loginBtn: {
    height: 58,
    backgroundColor: "#0066cc",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0066cc",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#dee2e6",
  },
  orText: {
    marginHorizontal: 20,
    color: "#6c757d",
    fontWeight: "600",
    fontSize: 14,
  },

  // NÚT GOOGLE SIÊU ĐẸP – giống web 100%
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: "#dadce0",
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  googleBtnPressed: {
    backgroundColor: "#f8f9fa",
    transform: [{ translateY: 1 }],
    shadowOpacity: 0.08,
    borderColor: "#c8cbcf",
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 16,
  },
  googleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3c4043",
    letterSpacing: 0.2,
  },
});
