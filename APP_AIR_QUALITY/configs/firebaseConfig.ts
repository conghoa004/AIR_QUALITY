// src/config/firebaseConfig.ts
import { initializeApp, getApps, getApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config lấy từ biến môi trường (Expo)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

// Tránh initialize lại app nếu đã có
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Auth và Firestore
// export const auth = getAuth(app);
export const dbFirebase = getFirestore(app);