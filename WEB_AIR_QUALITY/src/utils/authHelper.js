import crypto from "crypto";

// Tạo token reset password
export function generateToken() {
    const resetToken = crypto.randomBytes(32).toString("hex"); // token gốc gửi email
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex"); // hash lưu DB
    const expireTime = Date.now() + 15 * 60 * 1000; // 15 phút
    return { hashedToken, expireTime, resetToken };
}

// Check token reset password
export function checkToken(token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    return hashedToken;
}