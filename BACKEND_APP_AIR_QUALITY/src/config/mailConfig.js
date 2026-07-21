import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "Gmail",
    secure: true, // true với 465, false với 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Kiểm tra kết nối
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Lỗi kết nối email:", error);
    } else {
        console.log("✅ Kết nối email thành công!");
    }
});