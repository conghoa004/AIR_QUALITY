
// Nếu đã đăng nhập -> next
export const isLoggedIn = (req, res, next) => {
    if (req.session.user && req.session.user.status !== "Blocked") {
        return next();
    }
    res.status(401).json({ error: "Bạn chưa đăng nhập.", status: "isNotLogin" });
};

// Nếu chưa đăng nhập -> next
export const isNotLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    res.status(401).json({ error: "Bạn đã đăng nhập rồi.", status: "isLogin" });
};

// Nếu tài khoản không bị khóa -> next
export const isBlocked = (req, res, next) => {
    if (req.session.user.status === "Blocked") {
        return res.status(403).json({ error: "Tài khoản bị khóa!", status: "isBlocked" });
    }
    next();
}

// Nếu tài khoản phải là User -> next
export const isUser = (req, res, next) => {
    if (req.session.user.role === "User") {
        return next();
    }
    res.json({ error: "Vui lòng đăng nhập với quyền User.", status: "isNotUser" });
}
