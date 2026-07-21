import fetch from 'node-fetch';
import moment from "moment-timezone";
import clickHouseClient from '../config/clickHouseConfig.js';
import User from '../models/UserModel.js';
import { validateName, validateExpoToken } from '../utils/validates.js';
import NotificationAQI from '../models/NotificationAQI.js';
import { error } from 'console';

// Lấy API key và city từ biến môi trường
const API_KEY = process.env.OPEN_WEATHER_API;
const CITY = process.env.CITY;

// Lấy thông tin về thời tiết
export const getWeather = async (req, res) => {
    try {
        // Weather hiện tại
        const resWeather = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric&lang=vi`);
        const weatherData = await resWeather.json();

        // Forecast 5 ngày
        const resForecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric&lang=vi`);
        const forecastData = await resForecast.json();

        // Trả cả 2 data về frontend
        res.json({ weather: weatherData, forecast: forecastData });
    } catch (err) {
        res.status(500).json({ error: "Lỗi server" });
    }
}

// Lấy thống tin khu vực (Chức năng chọn khu vực)
export const getAreaInfo = async (req, res) => {
    try {
        const rs = await clickHouseClient.query({
            query: `SELECT DISTINCT sensor_id , concat(area, ' - ', location_name) AS area, latitude, longitude FROM air_quality_analytics`,
            format: 'JSONEachRow',
            query_params: {
            },
        })
        const result = await rs.json();

        const listAreas = result.map((item) => item.area);

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: "Lỗi server" });
    }
}

// Lấy Data theo khu vực
export const getAreaData = async (req, res) => {
    try {
        const { sensor_id } = req.body;

        if (!sensor_id || isNaN(sensor_id) || sensor_id <= 0) {
            return res.status(401).json({ error: "Tham số không hợp lệ!" });
        }

        const rs = await clickHouseClient.query({
            query: `SELECT sensor_id, datetimeLocal, aqi_pm25, aqi_pm10, aqi_co, aqi_no2, aqi_so2, aqi_o3, aqi_total 
                FROM air_quality_realtime 
                WHERE sensor_id = {sensor_id:UInt32} 
                AND datetimeLocal <= now() 
                AND datetimeLocal >= now() - INTERVAL 24 HOUR
                ORDER BY datetimeLocal DESC
                LIMIT 24;`,
            format: 'JSONEachRow',
            query_params: {
                sensor_id: sensor_id
            },
        })
        const result = await rs.json();

        // Không có dữ liệu
        if (result.length === 0) {
            return res.status(402).json({ error: "Không tìm thấy dữ liệu về khu vực này!", status: 402 });
        }

        // Lấy nhãn thông tin về thời gian
        const labels = result.map((item) => {
            // return moment(item.datetimeLocal).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
            return moment(item.datetimeLocal).format('HH:mm:ss');
        })

        // Tạo mãng dữ liệu
        const data = {
            aqi: result[0].aqi_total,
            co: result.map((item) => Number(item.aqi_co).toFixed(2)),
            no2: result.map((item) => Number(item.aqi_no2).toFixed(2)),
            so2: result.map((item) => Number(item.aqi_so2).toFixed(2)),
            o3: result.map((item) => Number(item.aqi_o3).toFixed(2)),
            pm25: result.map((item) => Number(item.aqi_pm25).toFixed(2)),
            pm10: result.map((item) => Number(item.aqi_pm10).toFixed(2)),
            last_updated: moment(result[0].datetimeLocal).format('DD/MM/YYYY HH:mm:ss')
        }

        res.status(200).json({ message: "Success", data, labels });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Lỗi server" });
    }
}

// Cập nhật vị trí người dùng
export const updateUser = async (req, res) => {
    try {
        const userId = req.session.user?.id;

        // Kiểm tra userId hợp lệ
        if (!userId) {
            return res.status(400).json({ error: "Tài khoản không hợp lệ." });
        }

        const allowedFields = [
            "nearest_sensor_id",
            "name",
            "avatar",
            "expo_push_token",
            "notification_interval",
            "notification_status"
        ];

        const updateData = {};

        // Lấy các field hợp lệ
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Kiểm tra dữ liệu
        if (updateData.name && !validateName(updateData.name)) {
            return res
                .status(400)
                .json({ error: "Họ tên không hợp lệ. Yêu cầu ít nhất 2 từ và chỉ chứa chữ cái." });
        }

        if (updateData.expo_push_token && updateData.expo_push_token.length < 10) {
            return res.status(400).json({ error: "Token expo không hợp lệ." });
        }

        if (updateData.nearest_sensor_id && isNaN(updateData.nearest_sensor_id)) {
            return res.status(400).json({ error: "Sensor id không hợp lệ." });
        }

        if (updateData.notification_interval && isNaN(updateData.notification_interval) && updateData.notification_interval < 0) {
            return res.status(400).json({ error: "Thời gian thống báo không hợp lệ." });
        }

        if (updateData.notification_status && (updateData.notification_status !== true && updateData.notification_status !== false)) {
            return res.status(400).json({ error: "Trang thái thống báo không hợp lệ." });
        }

        // Xử lý file ảnh
        if (req.file) {
            updateData.avatar = `${process.env.API_URL}/uploads/${req.file.filename}`;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Không có dữ liệu để cập nhật." });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "Người dùng không tồn tại." });
        }

        // Cập nhật thống báo người dùng
        res.status(200).json({ message: "Cập nhật thành công", updateData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Lỗi server" });
    }
};

// Lấy thông báo người dùng
export async function getAQINotification(req, res) {
    try {
        const user_id = req.session?.user?.id;
        if (!user_id) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const notifications = await NotificationAQI.find({
            user_id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "Success",
            notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
}

// Update Notifications
export async function updateAQINotification(req, res) {
    try {
        const user_id = req.session?.user?.id;
        if (!user_id) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const { _id } = req.body;
        if (!_id) {
            return res.status(400).json({ error: "ID not found" });
        }

        const result = await NotificationAQI.updateOne(
            { _id, user_id },
            { $set: { read: true } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.status(200).json({
            message: "Success"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
}

// Delete ALL notifications of user
export async function deleteAllAQINotifications(req, res) {
    try {
        const user_id = req.session?.user?.id;
        if (!user_id) {
            return res.status(401).json({ error: "Not logged in" });
        }

        const result = await NotificationAQI.deleteMany({ user_id });

        res.status(200).json({
            message: "Deleted all notifications",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Lỗi server" });
    }
}