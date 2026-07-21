import { useRouter } from 'expo-router';
import { safeParseJSON } from "../utils/validateHelper";

// Login truyền thống email và mật khóa
export async function loginService(email: string, password: string) {
  const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email,
      password: password,
    }),
    credentials: "include",
  });

  const data = await safeParseJSON(res);
  return { data, res };
}

// Login with Google
export async function loginGoogleService(idToken: string) {
  const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken: idToken,
    }),
    credentials: "include",
  });

  const data = await safeParseJSON(res);
  return { data, res };
}

// Check login
export async function checkLoginService() {
  const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/auth/check", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const data = await safeParseJSON(res);
  return { data, res };
}

// Logout
export async function logoutService() {
  const res = await fetch(process.env.EXPO_PUBLIC_API_URL + "/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await safeParseJSON(res);
  return { data, res };
}
