import express from 'express'
const routes = express.Router()
import dashboardController from '../controllers/dashboardController.js'
import { checkLogin, checkBlocked, checkAdmin } from '../middlewares/authMiddlewares.js';

// Tuyến đường trang dashboard
routes.get('/', checkLogin, checkBlocked, checkAdmin, dashboardController)

export default routes;