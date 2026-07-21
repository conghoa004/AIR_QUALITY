import express from 'express'
const routes = express.Router()

import analyticsController from '../controllers/analyticsController.js'
import { checkAdmin, checkLogin } from '../middlewares/authMiddlewares.js'

// Tuyến đường quản lý tài khoản
routes.get('/', checkLogin, analyticsController.renderAnalytics)

// Xử lý dữ liệu aqi theo từng ngày
routes.post("/aqi", checkLogin, analyticsController.getChartAQIDaily);

// Lấy thông tin node hiện tại
routes.post("/node-info", checkLogin, analyticsController.getNodeInfo);

// So sánh 2 node
routes.post("/compareNodes", checkLogin, analyticsController.compareNodes);

// Lấy top 10 khu vực ô nhiẽm
routes.post("/top10-area", checkLogin, analyticsController.getTop10Area);

export default routes;