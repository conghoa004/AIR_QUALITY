// src/config/firebaseConfig.js
import admin from "firebase-admin";
import path from "path";
import fs from "fs";

// Tạo đường dẫn tuyệt đối tới file serviceAccount JSON
const serviceAccountPath = path.resolve("./src/config/google-services.json");

// Đọc file JSON
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Export Firestore instance
const db = admin.firestore();

export { db };