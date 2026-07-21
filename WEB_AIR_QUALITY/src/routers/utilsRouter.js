import express from 'express'
const routes = express.Router()

import { renderSecurityAndPrivacy } from '../controllers/utilsController.js'

// Tuyến đường hóa tạo trang chính
routes.get('/security-and-privacy', renderSecurityAndPrivacy)

export default routes;