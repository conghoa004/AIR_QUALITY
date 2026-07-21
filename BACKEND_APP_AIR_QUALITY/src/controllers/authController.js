import User from "../models/UserModel.js";
import Session from "../models/SessionModel.js";
import { validateEmail, validatePassword } from "../utils/validates.js";
import { hashPassword, checkPassword, verifyGoogleToken, generatePassword } from "../utils/authHelper.js";
import e from "express";
import { info } from "console";

export default {
    // Check login
    check: async (req, res) => {
        try {
            if (req.session.user && req.session.user.status !== "Blocked") {
                return res.status(200).json({ message: "OK" });
            }
            return res.status(401).json({ error: "Not logged in" });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: "Internal server error" });
        }
    },

    // Xử lý đăng nhập
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate input
            if (!validateEmail(email)) {
                return res.status(401).json({ error: 'Email không hợp lệ!' });
            }

            if (!validatePassword(password)) {
                return res.status(401).json({ error: 'Mật khẩu không hợp lệ!' });
            }

            // Tìm user
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: 'Tài khoản không tồn tại!' });
            }

            // Role phải là user
            if (user.role !== "User") {
                return req.session.regenerate(err => {
                    if (err) console.error(err);
                    req.session.isInvalid = true;
                    return res.status(401).json({ error: 'Tài khoản phải là User!' });
                });
            }

            // Kiểm tra trạng thái
            if (user.status === "Blocked") {
                return res.status(402).json({ error: 'Tài khoản bị khóa!' });
            }

            // Kiểm tra mật khẩu
            const isMatch = await checkPassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu!' });
            }

            // Regenerate session để chống session fixation
            req.session.regenerate(async err => {
                if (err) {
                    console.error("Session regenerate error:", err);
                    return res.status(500).json({ error: "Không thể tạo session mới" });
                }

                // Save minimal user info
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    status: user.status,
                    expo_push_token: user.expo_push_token,
                    notification_interval: user.notification_interval,
                    notification_status: user.notification_status
                };

                // Lưu session vào database
                const sessionId = "sess:" + req.sessionID;
                await Session.create({ userId: user.id, sessionId });

                return res.status(200).json({ message: "Đăng nhập thành công.", info: req.session.user });
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Server error" });
        }
    },

    // Xử lý đăng nhập với google
    loginWithGoogle: async (req, res) => {
        try {
            const idToken = req.body.idToken;
            console.log("Received ID Token:", idToken);

            if (!idToken) {
                return res.status(401).json({ error: "Token không hợp lệ!" });
            }

            const payload = await verifyGoogleToken(idToken);
            if (!payload || !payload.email_verified) {
                return res.status(401).json({ error: "Token Google không hợp lệ!" });
            }

            const userGoogle = {
                email: payload.email,
                name: payload.name,
                avatar: payload.picture,
            };

            let user = await User.findOne({ email: userGoogle.email });

            // Tạo user mới nếu chưa tồn tại
            if (!user) {
                const password = generatePassword();
                const hashedPassword = await hashPassword(password);

                user = await User.create({
                    name: userGoogle.name,
                    email: userGoogle.email,
                    password: hashedPassword,
                    role: "User",
                    status: "Active",
                    avatar: userGoogle.avatar
                });
            }

            // Kiểm tra quyền & trạng thái
            if (user.status === "Blocked") {
                return res.status(402).json({ error: "Tài khoản đã bị khóa." });
            }
            if (user.role !== "User") {
                return res.status(401).json({ error: "Tài khoản không hợp lệ." });
            }

            // ====== LOGIN SESSION ======
            // Bọc regenerate trong Promise để function đợi đúng
            return await new Promise((resolve) => {
                req.session.regenerate(async (err) => {
                    if (err) {
                        console.error("Session regenerate error:", err);
                        return resolve(
                            res.status(500).json({ error: "Không thể tạo session mới" })
                        );
                    }

                    req.session.user = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        avatar: user.avatar,
                        status: user.status,
                        expo_push_token: user.expo_push_token,
                        notification_interval: user.notification_interval,
                        notification_status: user.notification_status
                    };

                    const sessionId = "sess:" + req.sessionID;
                    await Session.create({ userId: user.id, sessionId });

                    return resolve(
                        res.status(200).json({ message: "Đăng nhập thành công.", info: req.session.user })
                    );
                });
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Lỗi hệ thống." });
        }
    },

    // Xử lý đăng xuất
    logout: async (req, res) => {
        const sessionID = "sess:" + req.sessionID;
        req.session.destroy(async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Không thể đăng xuất" });
            }
            res.clearCookie("connect.sid");
            await Session.deleteOne({ sessionId: sessionID });
            return res.status(200).json({ message: "Đăng xuất thành công." });
        });
    }
};