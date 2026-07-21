import express from 'express'
const routes = express.Router()

import userController from '../controllers/userController.js'
import { upload } from '../config/multerConfig.js'
import { checkAdmin } from '../middlewares/authMiddlewares.js'
import deviceController from '../controllers/deviceManagerController.js'
import alertManagerController from '../controllers/alertManagerController.js'

// Tuyến đường quản lý tài khoản
routes.get('/user', checkAdmin, userController.renderUserManager)
routes.post('/user', checkAdmin, upload.single('avatar'), userController.addUser)
routes.put('/user', checkAdmin, upload.single('avatar'), userController.editUser)
routes.delete('/user', checkAdmin, userController.deleteUser)
routes.post('/user/block', checkAdmin, userController.blockUser)

// Tuyến đường quản lý thiết bị
routes.get('/device', checkAdmin, deviceController.renderView)

// Tuyến đường quản lý thống báo
routes.get('/alerts', checkAdmin, alertManagerController.renderAlert)

export default routes;