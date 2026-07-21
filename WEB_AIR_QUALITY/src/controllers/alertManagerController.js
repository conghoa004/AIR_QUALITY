import NodeStatus from "../models/NodeStatus.js";

const alertManagerController = {
    renderAlert: async (req, res) => {
        try {
            // 1️⃣ Lấy tất cả node từ MongoDB, sắp xếp theo createdAt giảm dần
            const alerts = await NodeStatus.find({})
                .sort({ createdAt: -1 }) // mới nhất lên đầu
                .lean(); // chuyển thành object thuần cho EJS

            // 2️⃣ Chuyển dữ liệu thành thông báo
            const alertList = alerts.map(node => ({
                _id: node._id,
                title: `Node ${node.sensor_id} - ${node.status.toUpperCase()}`,
                message: `Node ${node.sensor_id} tại ${node.area} - ${node.location_name} hiện đang ${node.status}`,
                createdAt: node.createdAt
            }));

            // 3️⃣ Render view
            res.render('admin/alert-manager', {
                title: 'Quản lý thông báo',
                layout: 'layouts/admin',
                alerts: alertList
            });

        } catch (error) {
            console.error("Lỗi khi lấy thông báo:", error);
            res.status(500).send("Lỗi server");
        }
    }
}

export default alertManagerController;