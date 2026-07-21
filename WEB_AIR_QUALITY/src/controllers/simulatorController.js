import { db } from "../config/firebaseConfig.js";
import { sendOfflineEmail } from '../utils/mailHelper.js';
import NodeStatus from '../models/NodeStatus.js';
import deviceController from '../controllers/deviceManagerController.js';

const simulatorController = {
    // Xử lý yêu cầu GET cho trang chính
    getIndexPage: (req, res) => {
        res.render('admin/simulator', {
            csrfToken: req.csrfToken(),
            layout: false  // <-- Không dùng layout
        });
    },

    // Xử lý yêu cầu GET cho API nodes
    getNodes: async (req, res) => {
        res.json(await deviceController.loadDeviceList());
    },

    // Cập nhật trạng thái node
    updateNodeStatus: async (req, res) => {
        try {
            const node_info = req.body;

            if (!node_info) {
                return res.status(400).json({ error: "node_info is required" });
            }

            const { sensor_id, status } = node_info;

            if (!sensor_id || !status) {
                return res.status(400).json({ error: "sensor_id and status are required" });
            }

            // Gửi email nếu offline
            if (status === "offline") {
                const adminEmail = process.env.EMAIL_USER;
                await sendOfflineEmail(adminEmail, node_info);

                // Lưu vào MongoDB (history)
                await NodeStatus.create({
                    ...node_info,
                    datetimeLocal: new Date(node_info.datetimeLocal || Date.now())
                });
            }

            // Cập nhật Firestore
            const nodeRef = db.collection("air_quality").doc(String(sensor_id));
            await nodeRef.set(node_info, { merge: true });

            res.json({ message: "Node status updated successfully" });

        } catch (error) {
            console.error("Error updating node status:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

export default simulatorController;