// deviceController.js
import { db } from "../config/firebaseConfig.js"; // Firestore

// Import ClickHouse client
import clickHouseClient from "../config/clickHouseConfig.js";

const deviceController = {
  // Render view
  renderView: async (req, res) => {
    try {
      const devices = await deviceController.loadDeviceList();

      res.render('admin/device-manager', {
        title: 'Quản lý thiết bị',
        layout: 'layouts/admin',
        devices
      });
    } catch (error) {
      console.error("Lỗi renderView:", error);
      res.render('admin/device-manager', {
        title: 'Quản lý thiết bị',
        layout: 'layouts/admin',
        devices: []
      });
    }
  },

  // Load device list từ MongoDB + Firestore
  loadDeviceList: async function () {
    try {
      // 1️⃣ Lấy danh sách devices từ Firestore
      let devicesList = [];
      try {
        const snapshot = await db.collection("air_quality").get();
        devicesList = snapshot.docs.map(doc => ({
          sensor_id: Number(doc.id),
          ...doc.data()
        }));
      } catch (error) {
        console.error("Lỗi khi lấy devices từ Firestore:", error);
      }

      // 2️⃣ Lấy dữ liệu từ ClickHouse
      const rows = await clickHouseClient.query({
        query: `SELECT
                        sensor_id,
                        area,
                        owner_name,
                        provider,
                        location_name,
                        timezone,
                        latitude,
                        longitude,
                        anyLast(aqi_total) AS last_aqi_total
                    FROM air_quality_analytics
                    GROUP BY
                        sensor_id, area, location_name, timezone, latitude, longitude, owner_name, provider
                    ORDER BY
                        sensor_id DESC
            `,
        format: 'JSONEachRow',
      });

      const result = await rows.json();

      // 4️⃣ Merge status từ Firestore
      const mergedResult = result.map(item => {
        const device = devicesList.find(d => d.sensor_id === item.sensor_id);
        return {
          ...item,
          status: device?.status || "offline"
        };
      });

      return mergedResult;

    } catch (error) {
      console.error("Lỗi loadDeviceList:", error);
      return [];
    }
  }
}

export default deviceController;
