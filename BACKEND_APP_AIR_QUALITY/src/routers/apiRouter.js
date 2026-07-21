import express from 'express'
const routes = express.Router()

import { upload } from '../config/multerConfig.js'
import { getAreaData, getWeather, getAreaInfo, updateUser, getAQINotification, updateAQINotification, deleteAllAQINotifications } from '../controllers/apiController.js'
import { isLoggedIn, isBlocked } from '../middlewares/authMiddlewares.js'

// Tuyến đường quản lý tài khoản
routes.get('/weather', isLoggedIn, isBlocked, getWeather)

// Tuyến đường lấy tên khu vực
routes.get('/area', isLoggedIn, isBlocked, getAreaInfo)

// Tuyến đường lấy data theo khu vực
routes.post('/data_sensor', isLoggedIn, isBlocked, getAreaData)

// Tuyến đường cập nhật vị trí người dùng
routes.put('/user', isLoggedIn, isBlocked, upload.single('avatar'), updateUser)

// Tuyến đường lấy dữ liệu thông báo user
routes.get('/notifications', isLoggedIn, isBlocked, getAQINotification)

// Tuyến đường cập nhật trạng thái notification
routes.put('/notifications', isLoggedIn, isBlocked, updateAQINotification)

// Xóa hết thông báo
routes.delete('/notifications', isLoggedIn, isBlocked, deleteAllAQINotifications)

export default routes;