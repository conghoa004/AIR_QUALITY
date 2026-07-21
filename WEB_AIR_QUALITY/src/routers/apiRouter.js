import express from 'express'
const routes = express.Router()

import apiController from '../controllers/apiController.js'
import { checkLogin } from '../middlewares/authMiddlewares.js'

// Tuyến đường quản lý tài khoản
routes.get('/weather', apiController.getWeather)

export default routes;