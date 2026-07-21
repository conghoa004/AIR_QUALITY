// Import các tuyến đường
import dashboardRouters from './dashboardRouters.js'
import authRoutes from './authRoutes.js';
import managerRouter from './managerRouters.js';
import apiRouter from './apiRouter.js';
import analyticsRouter from './analyticsRouter.js';
import simulatorRouter from './simulatorRouter.js';
import utilsRouter from './utilsRouter.js';

// Middleware kiểm tra đăng nhập
import { checkLogin, checkBlocked, checkAdmin } from '../middlewares/authMiddlewares.js';

export default function routers(app) {
    // Tuyến đường trang dashboard
    app.use('/', dashboardRouters)

    // Xử lý auth
    app.use('/auth', authRoutes);

    // Xử lý quản lý
    app.use('/manager', checkLogin, checkBlocked, managerRouter);

    // Tuyến đường mô phỏng thiết bị
    app.use('/simulator', checkLogin, checkBlocked, checkAdmin, simulatorRouter);

    // Tuyến đường API
    app.use('/api', checkLogin, checkBlocked, apiRouter);

    // Tuyến đường trang analytics
    app.use('/analytics', checkLogin, checkBlocked, checkAdmin, analyticsRouter);

    // Tuyến đường trang utils
    app.use('/utils', utilsRouter);

    // Nếu không tìm thấy tuyến đường, trang 404
    app.use((req, res) => res.status(404).render('partials/404', { layout: false }));
}