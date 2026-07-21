import express from 'express'
const routes = express.Router()
import simulatorController from '../controllers/simulatorController.js';

// Tuyến đường hiển thị trang mô phỏng thiết bị
routes.get('/', simulatorController.getIndexPage);

// Tuyến đường API lấy danh sách nodes
routes.get('/nodes', simulatorController.getNodes);

// Tuyến đường API cập nhật trạng thái node
routes.post('/status', simulatorController.updateNodeStatus);

export default routes;