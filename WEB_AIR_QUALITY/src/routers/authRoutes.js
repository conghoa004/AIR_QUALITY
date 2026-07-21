import express from "express";
import authController from "../controllers/authController.js";
import { verifyRecaptcha, checkNotLogin } from "../middlewares/authMiddlewares.js";
import passport from "passport";

const router = express.Router();

// Render pages
router.get("/login", checkNotLogin, authController.renderLogin);
router.get("/forgot-password", checkNotLogin, authController.renderForgotPassword);
router.get("/reset-password", checkNotLogin, authController.renderResetPassword);
router.get("/check-mail", checkNotLogin, authController.renderCheckMail);
router.get("/blocked", checkNotLogin, authController.renderBlocked);
router.get("/invalid", checkNotLogin, authController.renderInvalid);

// Handle actions
router.post("/forgot-password", checkNotLogin, verifyRecaptcha, authController.createPasswordResetToken);
router.post("/reset-password", checkNotLogin, verifyRecaptcha, authController.resetPassword);
router.post("/login", checkNotLogin, verifyRecaptcha, authController.login);
router.post("/logout", authController.logout);

// Google auth
// Tuyến đường đăng nhập với google /auth/google
router.get("/google",
    checkNotLogin, // middleware kiểm tra chưa login
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: 'select_account' // luôn hiện form chọn tài khoản
    }));

// Google callback /auth/google/callback
router.get("/google/callback",
    checkNotLogin, // middleware kiểm tra chưa login
    passport.authenticate("google", { failureRedirect: "/auth/login" }), authController.loginWithGoogle
);

// NOTE: Phải chưa đăng nhập thì mới thực hiện auth được

export default router;