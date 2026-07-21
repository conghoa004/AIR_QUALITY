import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();
import { isLoggedIn, isNotLoggedIn, isBlocked, isUser } from "../middlewares/authMiddlewares.js";

// Check login
router.get("/check", authController.check);

// Router login
router.post("/login", isNotLoggedIn, authController.login);

// Router login with google
router.post("/google", isNotLoggedIn, authController.loginWithGoogle);

// Router logout
router.post("/logout", isLoggedIn, authController.logout);

export default router;