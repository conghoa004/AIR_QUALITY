import dotenv from "dotenv";
dotenv.config();
import clickHouseClient from "../config/clickHouseConfig.js";
import moment from "moment-timezone";
import { calculateAQIDaily } from "../utils/aqiHelper.js";

// Lấy model cần đính kèm nếu có
const analyticsController = {
    // Hiển thị trang thống kê
    renderAnalytics: async (req, res) => {
        // Lấy danh sách node cảm biến
        const sensorList = await analyticsController.loadSensorList();
        res.render('admin/analytics', { title: 'Analytics', layout: 'layouts/admin', sensorList });
    },

    // Hàm load các node cảm biến ra (không trùng lặp)
    loadSensorList: async () => {
        try {
            const rows = await clickHouseClient.query({
                query: `SELECT DISTINCT sensor_id, area FROM air_quality_analytics`,
                params: {},
                format: 'JSONEachRow',
            });

            return await rows.json(); // lấy dữ liệu dạng JSON
        } catch (error) {
            console.error(error);
        }
    },

    // Hiển thị biểu đồ AQI theo ngày và dữ liệu trung bình
    getChartAQIDaily: async (req, res) => {
        try {
            const { start, end, sensor_id } = req.body;

            // Kiểm tra tính hợp lệ của 2 tham số đầu vào
            if (!start || !end) {
                return res.status(401).json({ error: "Tham số không hợp lệ!" });
            }

            const startMoment = moment.tz(start, "YYYY-MM-DD HH:mm:ss", "Asia/Ho_Chi_Minh");
            const endMoment = moment.tz(end, "YYYY-MM-DD HH:mm:ss", "Asia/Ho_Chi_Minh");

            if (!startMoment.isValid() || !endMoment.isValid()) {
                return res.status(401).json({
                    error: "Định dạng thời gian không hợp lệ!"
                });
            }

            if (startMoment.isAfter(endMoment)) {
                return res.status(401).json({
                    error: "Thời gian bắt đầu phải trên thời gian kết thúc!"
                });
            }

            const rows = await clickHouseClient.query({
                query: `SELECT 
                    sensor_id,
                    area,
                    any(location_name) AS location_name,
                    max(co_avg) AS co,
                    max(no2_avg) AS no2,
                    max(so2_avg) AS so2,
                    avg(pm25_avg) AS pm25,
                    avg(pm10_avg) AS pm10,
                    max(o3_avg) AS o3,
                    max(o3_8h_avg) AS o3_8h,
                    toDate(datetimeLocal) AS days
                FROM air_quality_analytics
                WHERE datetimeLocal BETWEEN {start:DateTime} AND {end:DateTime} 
                AND sensor_id = {sensor_id:UInt32}
                GROUP BY sensor_id, days, area
                ORDER BY days;`,
                query_params: {
                    sensor_id: sensor_id,
                    start: start,
                    end: end
                },
                format: 'JSONEachRow',
            });

            const result = await rows.json();

            // Tạo mảng data tạm
            let data = [];

            // Tính AQI theo giờ
            result.forEach((item) => {
                const aqiHourly = calculateAQIDaily(item.co,
                    item.no2, item.so2, item.o3, item.o3_8h,
                    item.pm25, item.pm10);

                let rows = {
                    sensor_id: item.sensor_id,
                    area: item.area,
                    location_name: item.location_name,
                    aqi_total: Number(aqiHourly.AQI_D).toFixed(2),
                    aqi_co: Number(aqiHourly.Details.CO).toFixed(2),
                    aqi_no2: Number(aqiHourly.Details.NO2).toFixed(2),
                    aqi_so2: Number(aqiHourly.Details.SO2).toFixed(2),
                    aqi_o3: Number(aqiHourly.Details.O3).toFixed(2),
                    aqi_pm10: Number(aqiHourly.Details.PM10).toFixed(2),
                    aqi_pm25: Number(aqiHourly.Details.PM25).toFixed(2),
                    datetimeLocal: item.days
                }

                data.push(rows);
            })

            if (data.length === 0) {
                return res.status(401).json({ error: "Không tìm thấy dữ liệu!", status: 401 });
            }

            // Tính trung bình tổng AQI theo ngày cho từng thông số
            const aqiAvg = {
                co_avg: 0,
                no2_avg: 0,
                so2_avg: 0,
                o3_avg: 0,
                pm10_avg: 0,
                pm25_avg: 0
            }

            data.forEach((item) => {
                aqiAvg.co_avg += parseFloat(item.aqi_co);
                aqiAvg.no2_avg += parseFloat(item.aqi_no2);
                aqiAvg.so2_avg += parseFloat(item.aqi_so2);
                aqiAvg.o3_avg += parseFloat(item.aqi_o3);
                aqiAvg.pm10_avg += parseFloat(item.aqi_pm10);
                aqiAvg.pm25_avg += parseFloat(item.aqi_pm25);
            })

            aqiAvg.co_avg = (aqiAvg.co_avg / data.length).toFixed(2);
            aqiAvg.no2_avg = (aqiAvg.no2_avg / data.length).toFixed(2);
            aqiAvg.so2_avg = (aqiAvg.so2_avg / data.length).toFixed(2);
            aqiAvg.o3_avg = (aqiAvg.o3_avg / data.length).toFixed(2);
            aqiAvg.pm10_avg = (aqiAvg.pm10_avg / data.length).toFixed(2);
            aqiAvg.pm25_avg = (aqiAvg.pm25_avg / data.length).toFixed(2);

            res.json({ chart: data, aqiAvg: aqiAvg });
        } catch (error) {
            console.error("Error in calculateAQIDaily:", error);
            res.status(500).json({ error: "Lỗi server", error });
        }
    },

    // Lấy thông tin node hiện tại
    getNodeInfo: async (req, res) => {
        try {
            const { sensor_id } = req.body;

            if (!sensor_id) {
                return res.status(401).json({ error: "Tham số không hợp lệ!" });
            }

            const rows = await clickHouseClient.query({
                query: `SELECT DISTINCT sensor_id, area, location_name, latitude, longitude, datetimeLocal
                        FROM air_quality_analytics 
                        WHERE sensor_id = {sensor_id:UInt32}
                        ORDER BY datetimeLocal DESC
                        LIMIT 1;`,
                query_params: {
                    sensor_id: sensor_id
                },
                format: 'JSONEachRow',
            });

            const result = await rows.json();

            if (result.length === 0) {
                return res.status(401).json({ error: "Không tìm thấy dữ liệu!", status: 401 });
            }

            // Trả về kết quả truy vấn
            res.json(result);
        } catch (error) {
            console.error("Error in getNodeInfo:", error);
            res.status(500).json({ error: "Lỗi server", error });
        }
    },

    // Tính AQI từng ngày của môi trường
    calculateAQIDailyAverage: async (sensor_id, start, end) => {
        try {
            const rows = await clickHouseClient.query({
                query: `SELECT 
                    sensor_id,
                    area,
                    any(location_name) AS location_name,
                    any(latitude) AS latitude,
                    any(longitude) AS longitude,
                    max(co_avg) AS co,
                    max(no2_avg) AS no2,
                    max(so2_avg) AS so2,
                    avg(pm25_avg) AS pm25,
                    avg(pm10_avg) AS pm10,
                    max(o3_avg) AS o3,
                    max(o3_8h_avg) AS o3_8h,
                    toDate(datetimeLocal) AS days
                FROM air_quality_analytics
                WHERE datetimeLocal BETWEEN {start:DateTime} AND {end:DateTime} 
                AND sensor_id = {sensor_id:UInt32}
                GROUP BY sensor_id, days, area
                ORDER BY days;`,
                query_params: {
                    sensor_id: sensor_id,
                    start: start,
                    end: end
                },
                format: 'JSONEachRow',
            });

            const result = await rows.json();

            // Tạo mảng data tạm
            let data = [];

            // Tính AQI theo giờ
            result.forEach((item) => {
                const aqiHourly = calculateAQIDaily(item.co,
                    item.no2, item.so2, item.o3, item.o3_8h,
                    item.pm25, item.pm10);

                let rows = {
                    sensor_id: item.sensor_id,
                    area: item.area,
                    location_name: item.location_name,
                    aqi_total: Number(aqiHourly.AQI_D),
                    aqi_co: Number(aqiHourly.Details.CO),
                    aqi_no2: Number(aqiHourly.Details.NO2),
                    aqi_so2: Number(aqiHourly.Details.SO2),
                    aqi_o3: Number(aqiHourly.Details.O3),
                    aqi_pm10: Number(aqiHourly.Details.PM10),
                    aqi_pm25: Number(aqiHourly.Details.PM25),
                    datetimeLocal: item.days
                }

                data.push(rows);
            })

            if (data.length === 0) {
                return res.status(401).json({ error: "Không tìm thấy dữ liệu!", status: 401 });
            }

            // Tính trung bình tổng AQI theo ngày cho từng thông số
            const aqiAvg = {
                sensor_id: result[0].sensor_id,
                area: result[0].area,
                location_name: result[0].location_name,
                last_update: moment().tz(result[result.length - 1].days, "Asia/Ho_Chi_Minh"),
                latitude: result[0].latitude,
                longitude: result[0].longitude,
                co_avg: 0,
                no2_avg: 0,
                so2_avg: 0,
                o3_avg: 0,
                pm10_avg: 0,
                pm25_avg: 0,
                aqi_total: 0
            }

            data.forEach((item) => {
                aqiAvg.co_avg += parseFloat(item.aqi_co);
                aqiAvg.no2_avg += parseFloat(item.aqi_no2);
                aqiAvg.so2_avg += parseFloat(item.aqi_so2);
                aqiAvg.o3_avg += parseFloat(item.aqi_o3);
                aqiAvg.pm10_avg += parseFloat(item.aqi_pm10);
                aqiAvg.pm25_avg += parseFloat(item.aqi_pm25);
                aqiAvg.aqi_total += parseFloat(item.aqi_total);
            })

            aqiAvg.co_avg = (aqiAvg.co_avg / data.length);
            aqiAvg.no2_avg = (aqiAvg.no2_avg / data.length);
            aqiAvg.so2_avg = (aqiAvg.so2_avg / data.length);
            aqiAvg.o3_avg = (aqiAvg.o3_avg / data.length);
            aqiAvg.pm10_avg = (aqiAvg.pm10_avg / data.length);
            aqiAvg.pm25_avg = (aqiAvg.pm25_avg / data.length);
            aqiAvg.aqi_total = (aqiAvg.aqi_total / data.length);

            return aqiAvg;
        } catch (error) {
            console.error("Error in calculateAQIDaily:", error);
            return null;
        }
    },

    // Compare 2 nodes
    compareNodes: async (req, res) => {
        try {
            const sensor_id_1 = req.body.sensor_id_1;
            const sensor_id_2 = req.body.sensor_id_2;
            const startDate = req.body.start;
            const endDate = req.body.end;

            // --- Kiểm tra đầu vào ---
            if (!sensor_id_1 || !sensor_id_2) {
                return res.status(400).json({
                    error: "Thiếu ID cảm biến. Vui lòng gửi đủ sensor_id_1 và sensor_id_2."
                });
            }

            // --- Kiểm tra kiểu dữ liệu ---
            if (isNaN(sensor_id_1) || isNaN(sensor_id_2)) {
                return res.status(400).json({
                    error: "ID cảm biến phải là số."
                });
            }

            // --- Kiểm tra trùng lặp ---
            if (sensor_id_1 === sensor_id_2) {
                return res.status(400).json({
                    error: "Hai cảm biến không được trùng nhau."
                });
            }

            // --- Kiểm tra ngày tháng ---
            const startMoment = moment.tz(startDate, "YYYY-MM-DD HH:mm:ss", "Asia/Ho_Chi_Minh");
            const endMoment = moment.tz(endDate, "YYYY-MM-DD HH:mm:ss", "Asia/Ho_Chi_Minh");

            if (!startMoment.isValid() || !endMoment.isValid()) {
                return res.status(400).json({
                    error: "Định dạng thời gian không hợp lệ."
                });
            }

            if (startMoment.isAfter(endMoment)) {
                return res.status(400).json({
                    error: "Thời gian bắt đầu phải trước thời gian kết thúc."
                });
            }

            // Lấy dữ liệu của cả 2 cảm biến
            const node1 = await analyticsController.calculateAQIDailyAverage(sensor_id_1, startDate, endDate);
            const node2 = await analyticsController.calculateAQIDailyAverage(sensor_id_2, startDate, endDate);

            if (!node1 || !node2) {
                return res.status(404).json({
                    error: "Không tìm thấy dữ liệu cho một hoặc cả hai cảm biến."
                });
            }

            res.json({ result: [node1, node2] });

        } catch (error) {
            console.error("Error in compareNodes:", error);
            res.status(500).json({ error: "Lỗi server", details: error.message });
        }
    },

    // Lấy top 10 khu vực có AQI cao nhất
    getTop10Area: async (req, res) => {
        try {
            const { start, end } = req.body;

            if (!start || !end) {
                return res.status(401).json({ error: "Tham số không hợp lệ!" });
            }

            const startMoment = moment.tz(start, "YYYY-MM-DD HH:mm:ss", "Asia/Ho_Chi_Minh");
            const endMoment = moment.tz(end, "YYYY-MM-DD HH:mm:ss", "Asia/Ho_Chi_Minh");

            if (!startMoment.isValid() || !endMoment.isValid()) {
                return res.status(401).json({ error: "Định dạng thời gian không hợp lệ!" });
            }

            if (startMoment.isAfter(endMoment)) {
                return res.status(401).json({ error: "Thời gian bắt đầu phải trước thời gian kết thúc!" });
            }

            // Lấy tất cả sensor_id không trùng
            const rows = await clickHouseClient.query({
                query: `SELECT DISTINCT sensor_id FROM air_quality_analytics 
                    WHERE datetimeLocal BETWEEN {start:DateTime} AND {end:DateTime}`,
                query_params: { start, end },
                format: "JSONEachRow",
            });

            const sensorIds = await rows.json();

            if (sensorIds.length === 0) {
                return res.status(404).json({ error: "Không tìm thấy dữ liệu." });
            }

            // Tính AQI trung bình từng sensor/khu vực
            const results = await Promise.all(sensorIds.map(async (sensor) => {
                const { sensor_id } = sensor;
                return await analyticsController.calculateAQIDailyAverage(sensor_id, start, end);
            }));

            // Lọc null (nếu sensor không có dữ liệu)
            const filteredResults = results.filter(r => r !== null);

            // Sắp xếp giảm dần theo aqi_total
            filteredResults.sort((a, b) => b.aqi_total - a.aqi_total);

            // Lấy top 10
            const top10 = filteredResults.slice(0, 10);

            // Chuẩn hóa dữ liệu
            const top10Formatted = top10.map(item => {
                return {
                    location: item.area + " - " + item.location_name,
                    aqi_total: item.aqi_total.toFixed(2)
                };
            });

            res.json(top10Formatted);

        } catch (error) {
            console.error("Error in getTop10Area:", error);
            res.status(500).json({ error: "Lỗi server", details: error.message });
        }
    }
}

export default analyticsController;