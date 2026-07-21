import fetch from "node-fetch";

// Kiểm tra reCAPTCHA
export const verifyRecaptcha = async (req, res, next) => {
    try {
        const { recaptcha_token } = req.body;
        const SECRET_KEY = process.env.SECRET_KEY;

        if (!recaptcha_token) {
            return res.status(400).json({ error: "reCAPTCHA token không tồn tại" });
        }

        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${recaptcha_token}`;
        const response = await fetch(verifyUrl, { method: "POST" });
        const data = await response.json();

        if (!data.success || data.score < 0.5) {
            return res.status(400).json({ error: "reCAPTCHA xác thực thất bại" });
        }

        // reCAPTCHA hợp lệ → tiếp tục middleware/route handler
        console.log("✅ reCAPTCHA hợp lệ");
        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Lỗi server khi kiểm tra reCAPTCHA" });
    }
};

// Kiểm tra đăng nhập
export const checkLogin = (req, res, next) => {
    if (req.session.user && req.session.user.status !== "Blocked") {
        return next();
    }
    res.redirect("/auth/login");
};

// Kiểm tra chưa đăng nhập
export const checkNotLogin = (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    res.redirect("/");
};

// Kiểm tra tài khoản có bị khóa không
export const checkBlocked = (req, res, next) => {
    if (req.session.user.status === "Blocked") {
        return res.status(403).json({ error: "Tài khoản bị khóa!" });
    }
    next();
}

// Kiểm tra quyền admin
export const checkAdmin = (req, res, next) => {
    if (req.session.user.role === "Admin") {
        return next();
    }
    res.redirect("/");
}
