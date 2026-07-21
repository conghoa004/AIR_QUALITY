// Import các tuyến đường
import authRoutes from './authRoutes.js';
import apiRouter from './apiRouter.js';

// Middleware kiểm tra đăng nhập
import { isBlocked, isLoggedIn, isNotLoggedIn, isUser } from '../middlewares/authMiddlewares.js';

export default function routers(app) {

    // Xử lý auth
    app.use('/auth', authRoutes);

    // Tuyến đường API
    app.use('/api', apiRouter);

    // Test API
    app.get("/", (req, res) => {
        res.status(200).json({ message: "Server is running successfully" });
    });
}