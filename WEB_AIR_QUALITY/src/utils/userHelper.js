import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Session from '../models/SessionModel.js';
import redisClient from '../config/redisConfig.js';

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

// Hàm tạo họ tên user
export function formatName(name) {
    if (!name) return '';
    const words = name.trim().split(/\s+/); // tách theo 1 hoặc nhiều khoảng trắng, loại bỏ khoảng trắng đầu/cuối
    if (words.length === 1) return words[0]; // nếu chỉ có 1 từ
    return words[0] + " " + words[words.length - 1]; // họ + tên
}

// Hàm validate dữ liệu người dùngg
export const validateUser = {
    // Kiểm tra tên: ít nhất 2 từ, chỉ chữ cái và khoảng trắng
    validateName: function (name) {
        if (!name) return false;
        name = name.trim();
        if (!/^[A-Za-zÀ-Ỵà-ỵĂăÂâÊêÔôƠơƯưĐđ\s]+$/.test(name)) return false;
        if (name.split(/\s+/).filter(Boolean).length < 2) return false;
        return true;
    },

    // Kiểm tra email hợp lệ
    validateEmail: function (email) {
        if (!email) return false;
        email = email.trim();
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    },

    // Kiểm tra vai trò hợp lệ (Admin/User)
    validateRole: function (role) {
        return role === 'Admin' || role === 'User';
    },

    // Kiểm tra trạng thái hợp lệ (Active/Blocked)
    validateStatus: function (status) {
        return status === 'Active' || status === 'Blocked';
    },

    // Kiểm tra avatar (nếu muốn)
    validateAvatar: function (avatar) {
        // Chỉ kiểm tra kiểu string, có thể nâng cấp kiểm tra URL/file type
        return typeof avatar === 'string' && avatar.trim().length > 0;
    },

    // Kiểm tra mật khẩu mạnh
    validatePassword: function (password) {
        if (!password) return false;
        // Mật khẩu >=8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        return strongPasswordRegex.test(password);
    },

    // Kiểm tra xác nhận mật khẩu khớp với mật khẩu
    validateConfirmPassword: function (password, confirmPassword) {
        return password === confirmPassword;
    },
}

// Hàm block tài khoản
export async function blockUser(userId) {
    // Lấy session
    const sessions = await Session.find({ userId: userId }).select('sessionId');

    // Xóa session khỏi MongoDB
    await Session.deleteMany({ userId: userId });

    // Xóa session khỏi Redis
    sessions.forEach(session => redisClient.del(session.sessionId));
}

// Hàm cập nhật session
export async function updateSession(userId, name, avatar) {
    try {
        // 1. Lấy tất cả session của user
        const sessions = await Session.find({ userId }).select('sessionId');

        if (!sessions.length) return; // không có session thì thôi

        // 2. Cập nhật Redis cho session có user
        await Promise.all(
            sessions.map(async (session) => {
                try {
                    const data = await redisClient.get(session.sessionId);
                    if (!data) return; // bỏ qua nếu session không tồn tại

                    let jsonData;
                    try {
                        jsonData = JSON.parse(data);
                    } catch (err) {
                        console.error(`Lỗi parse JSON cho session ${session.sessionId}:`, err);
                        return; // bỏ qua nếu JSON lỗi
                    }

                    if (!jsonData.user) return; // bỏ qua nếu không có user

                    // Cập nhật name & avatar
                    jsonData.user.name = name;
                    jsonData.user.avatar = avatar;

                    await redisClient.set(session.sessionId, JSON.stringify(jsonData));
                    console.log(`Cập nhật session ${session.sessionId} thành công`);
                } catch (err) {
                    console.error(`Lỗi cập nhật session ${session.sessionId}:`, err);
                }
            })
        );
    } catch (err) {
        console.error("Lỗi update session:", err);
    }
}