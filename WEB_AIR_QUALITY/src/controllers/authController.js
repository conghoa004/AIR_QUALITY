import User from "../models/UserModel.js";
import Session from "../models/SessionModel.js";
import { validateUser, hashPassword, checkPassword } from "../utils/userHelper.js";
import { sendResetPasswordEmail } from "../utils/mailHelper.js";
import { generateToken, checkToken } from "../utils/authHelper.js";

export default {
    // Hiển thị trang đăng nhập
    renderLogin: (req, res) => {
        res.render("auth/login", { layout: false });
    },

    // Hiển thị trang đăng ký
    renderForgotPassword: (req, res) => {
        res.render("auth/forgot-password", { layout: false });
    },

    // Hiển thị trang reset password
    renderResetPassword: async (req, res) => {
        try {
            const { token } = req.query;

            if (!token) {
                console.log("token not found");
                return res.status(404).render("partials/404", { layout: false });
            }

            // Kiểm tra token
            const hashedToken = checkToken(token);

            const user = await User.findOne({ reset_password_token: hashedToken });
            if (!user) {
                console.log("user not found");
                return res.status(404).render("partials/404", { layout: false });
            }

            // Hiển thị trang reset password
            return res.render("auth/reset-password", { layout: false, token });
        } catch (error) {
            console.log(error);
            return res.status(404).render("partials/404", { layout: false });
        }
    },

    // Hiển thị trang thông báo kiểm tra email
    renderCheckMail: async (req, res) => {
        try {
            const { token } = req.query;
            console.log(token);

            if (!token) {
                console.log("token not found");
                return res.status(404).render("partials/404", { layout: false });
            }

            // Kiểm tra token
            const hashedToken = checkToken(token);

            const user = await User.findOne({ reset_password_token: hashedToken });
            if (!user) {
                console.log("user not found");
                return res.status(404).render("partials/404", { layout: false });
            }

            // Kiểm tra token hết hạn
            if (user.reset_password_expire < Date.now()) {
                console.log("token expired");
                return res.status(404).render("partials/404", { layout: false });
            }

            // Hiển thị trang check mail
            res.render("auth/check-mail", { layout: false });
        } catch (error) {
            console.log(error);
            return res.status(404).render("partials/404", { layout: false });
        }
    },

    // Hiển thị trang blocked
    renderBlocked: (req, res) => {
        if (req.session && req.session.isBlocked) {
            // Xóa key
            delete req.session.isBlocked;

            // Hiển thị trang blocked
            res.render("auth/blocked", { layout: false });
        } else {
            // Hiển thị trang blocked
            res.render("partials/404", { layout: false });
        }
    },

    // Hiển thị trang tài khoản không hợp lệ
    renderInvalid: (req, res) => {
        if (req.session && req.session.isInvalid) {
            // Xóa key
            delete req.session.isInvalid;
            // Hiển thị trang invalid
            res.render("auth/invalid", { layout: false });
        } else {
            // Hiển thị trang invalid
            res.render("partials/404", { layout: false });
        }
    },

    // Xử lý đăng ký tạo token reset password
    createPasswordResetToken: async (req, res) => {
        try {
            const { email } = req.body;

            if (!validateUser.validateEmail(email)) {
                return res.status(400).json({ error: 'Email không hợp lệ.' });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: 'User không tồn tại.' });
            }

            // Kiểm tra trạng thái
            if (user.status === "Blocked") {
                return res.status(402).json({ error: 'Tài khoản bị khóa.' });
            }

            // Kiêm tra token hết hạn chưa mới thực hiện cấp mới
            if (user.reset_password_token && user.reset_password_expire > Date.now()) {
                return res.status(403).json({ error: 'Token chưa hết hạn. Vui lý kiểm tra email.' });
            }

            // Sinh token
            const { hashedToken, expireTime, resetToken } = generateToken();

            // Lưu DB
            user.reset_password_token = hashedToken;
            user.reset_password_expire = expireTime;
            await user.save({ validateBeforeSave: false });

            // Tạo link và gửi email
            const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}`;

            // Gửi mail
            await sendResetPasswordEmail(user.email, resetUrl, user.name || "AirQuality User");

            return res.status(200).json({ message: "Vui lòng kiểm tra email để reset password.", token: resetToken });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Server error" });
        }
    },

    // Xử lý đổi mật khẩu
    resetPassword: async (req, res) => {
        try {
            const { newPassword, confirmPassword, resetToken } = req.body;

            // Kiểm tra token
            const hashedToken = checkToken(resetToken);

            const user = await User.findOne({ reset_password_token: hashedToken });
            if (!user) {
                return res.status(400).json({ error: 'Token không hợp lệ.' });
            }

            if (user.status === "Blocked") {
                console.log("Tài khoản bị khóa.");
                return res.status(402).json({ error: 'Tài khoản bị khóa!' });
            }

            // Kiểm tra mật khẩu
            if (!validateUser.validatePassword(newPassword)) {
                return res.status(400).json({ error: 'Mật khẩu không hợp lệ.' });
            }

            if (!validateUser.validatePassword(confirmPassword)) {
                return res.status(400).json({ error: 'Mật khẩu không hợp lệ.' });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({ error: 'Mật khẩu không hợp lệ.' });
            }

            // Mã hóa mật khóa
            const hashedPassword = await hashPassword(newPassword);

            // Lưu DB
            user.password = hashedPassword;
            user.reset_password_token = null;
            user.reset_password_expire = null;
            await user.save({ validateBeforeSave: false });

            return res.status(200).json({ message: "Đổi mật khẩu thành công." });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Server error" });
        }
    },

    // XỬ LÝ ĐĂNG NHẬP
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!validateUser.validateEmail(email)) {
                console.log("Email không hợp lệ.");
                return res.status(401).json({ error: 'Email không hợp lệ!' });
            }

            if (!validateUser.validatePassword(password)) {
                console.log("Mật khóa không hợp lệ.");
                return res.status(401).json({ error: 'Mật khóa không hợp lệ!' });
            }

            const user = await User.findOne({ email });

            // Kiểm tra tài khoản phải là Admin
            if (user.role !== "Admin") {
                console.log("Tài khoản phải là Admin.");
                return req.session.regenerate(err => {
                    if (err) console.error(err);
                    req.session.isInvalid = true;
                    return res.status(403).json({ error: 'Tài khoản phải là Admin!' });
                });
            }

            if (!user) {
                console.log("Tài khoản không tồn tại.");
                return res.status(401).json({ error: 'Tài khoản không tồn tại!' });
            }

            if (user.status === "Blocked") {
                console.log("Tài khoản bị khóa.");
                return res.status(402).json({ error: 'Tài khoản bị khóa!' });
            }

            const isMatch = await checkPassword(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu!' });
            }

            // Regenerate session để chống session fixation (reset session key)
            req.session.regenerate(err => {
                if (err) {
                    console.error("Session regenerate error:", err);
                    return res.status(500).json({ error: "Không thể tạo session mới" });
                }

                // Lưu session chỉ với thông tin cần thiết
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    status: user.status
                };

                // Lưu session id vào db
                const sessionId = "sess:" + req.sessionID;
                Session.create({ userId: user.id, sessionId: sessionId });

                // Trả thông báo đăng nhập thành công
                res.status(200).json({ message: "Đăng nhập thành công." });
            });
        }

        catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Server error" });
        }
    },

    // Xử lý đăng nhập với google
    loginWithGoogle: async (req, res) => {
        try {
            const email = req.user._json.email;

            // Email không hợp lệ
            if (!validateUser.validateEmail(email)) {
                console.log("Email không hợp lệ.");
                return req.session.regenerate(err => {
                    if (err) console.error(err);
                    // Lưu cờ báo lỗi để trang invalid biết
                    req.session.isInvalid = true;
                    return res.redirect('/auth/invalid');
                });
            }

            const user = await User.findOne({ email });

            // Kiểm tra tài khoản phải là Admin
            if (user.role !== "Admin") {
                console.log("Tài khoản phải là Admin.");
                return req.session.regenerate(err => {
                    if (err) console.error(err);
                    req.session.isInvalid = true;
                    return res.redirect('/auth/invalid');
                });
            }

            // Tài khoản không tồn tại
            if (!user) {
                console.log("Tài khoản không tồn tại.");
                return req.session.regenerate(err => {
                    if (err) console.error(err);
                    req.session.isInvalid = true;
                    return res.redirect('/auth/invalid');
                });
            }

            // Tài khoản bị khóa
            if (user.status === "Blocked") {
                console.log("Tài khoản bị khóa.");
                return req.session.regenerate(err => {
                    if (err) console.error(err);
                    req.session.isBlocked = true;
                    return res.redirect('/auth/blocked');
                });
            }

            // Đăng nhập thành công: tạo session mới
            req.session.regenerate(err => {
                if (err) {
                    console.error("Session regenerate error:", err);
                    return res.status(500).json({ error: "Không thể tạo session mới" });
                }

                // Lưu thông tin user vào session
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    status: user.status
                };

                // Lưu session ID vào DB
                const sessionId = "sess:" + req.sessionID;
                Session.create({ userId: user.id, sessionId: sessionId });

                return res.redirect('/');
            });
        } catch (error) {
            console.error(error);
            return req.session.regenerate(err => {
                if (err) console.error(err);
                return res.redirect('/auth/login');
            });
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