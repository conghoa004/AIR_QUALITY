import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Hàm kiểm tra token google
export async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // Client ID phải trùng với bên App
        });

        const payload = ticket.getPayload();

        /**
         * payload sẽ có các field:
         * - payload.email
         * - payload.name
         * - payload.picture
         * - payload.sub (ID Google)
         */

        return payload;
    } catch (err) {
        console.error("Verify Google Token Error:", err);
        return null;
    }
}

// Hàm tạo mật khẩu ngẫu nhiên
export function generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
}

// Hàm băm mã hóa mật khẩu mật khẩu
export async function hashPassword(password) {
    const hashed = await bcrypt.hash(password, 10);
    return hashed;
}

// Hàm kiểm tra mật khẩu mã hóa
export async function checkPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}