import { transporter } from "../config/mailConfig.js";

export const sendResetPasswordEmail = async (to, resetUrl, userName = "AirQuality User") => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AirQuality - Reset Password</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f2f4f6;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
            }
            .header {
                background-color: #0078D7;
                padding: 20px;
                text-align: center;
            }
            .header img {
                width: 120px;
                height: auto;
            }
            .logo {
                font-family: 'Arial', sans-serif;
                font-weight: bold;
                font-size: 36px;
            }
            .logo .smart {
                color: #00bfff; /* màu xanh dương */
            }
            .logo .house {
                color: #ffb400; /* màu vàng cam */
            }
            .content {
                padding: 30px 25px;
            }
            h1 {
                font-size: 24px;
                color: #333333;
                margin-bottom: 20px;
            }
            p {
                font-size: 16px;
                color: #555555;
                line-height: 1.6;
            }
            .btn {
                display: inline-block;
                padding: 14px 24px;
                margin-top: 25px;
                background-color: #0078D7;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                transition: background 0.3s ease;
            }
            .btn:hover {
                background-color: #005EA6;
            }
            .footer {
                background-color: #f5f5f5;
                text-align: center;
                padding: 15px;
                font-size: 12px;
                color: #999999;
            }
            @media (max-width: 600px) {
                .content {
                    padding: 20px 15px;
                }
                h1 {
                    font-size: 20px;
                }
                .btn {
                    padding: 12px 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">
                    <span class="smart">Air</span> <span class="house">Quality</span>
                </div>
            </div>
            <div class="content">
                <h1>Xin chào, ${userName}</h1>
                <p>Bạn vừa yêu cầu đổi mật khẩu cho tài khoản AirQuality của mình.</p>
                <p>Nhấn nút dưới đây để đặt lại mật khẩu. Link chỉ có hiệu lực trong 15 phút.</p>
                <a class="btn" href="${resetUrl}">Đặt lại mật khẩu</a>
                <p>Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này.</p>
            </div>
            <div class="footer">
                © 2025 AirQuality. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"AirQuality Support" <${process.env.EMAIL_USER}>`,
            to,
            subject: "Đặt lại mật khẩu cho tài khoản AirQuality",
            html: htmlContent,
        });
        console.log("✅ Email đã gửi:", info.messageId);
    } catch (error) {
        console.error("❌ Lỗi gửi email:", error);
        throw error;
    }
};

export const sendOfflineEmail = async (to, node_info, userName = "AirQuality") => {
    const status_text = "OFFLINE";
    const status_color = "#dc2626"; // đỏ cho offline
    const mapsLink = `https://www.google.com/maps?q=${node_info.latitude},${node_info.longitude}&zoom=15`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Air Quality Node Status</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f2f4f6;
                margin: 0; padding: 0;
            }
            .email-container {
                max-width: 650px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                border: 1px solid #e5e7eb;
            }
            .header {
                background-color: ${status_color};
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            .header h1 {
                margin: 0;
                font-size: 26px;
            }
            .badge {
                display: inline-block;
                padding: 6px 16px;
                font-size: 14px;
                font-weight: bold;
                border-radius: 20px;
                background-color: white;
                color: ${status_color};
                margin-left: 10px;
            }
            .content {
                padding: 30px 25px;
                color: #4b5563;
            }
            .content p {
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                font-size: 14px;
            }
            table, th, td {
                border: 1px solid #e5e7eb;
            }
            th, td {
                padding: 12px 10px;
                text-align: left;
            }
            th {
                background-color: #f9fafb;
                font-weight: bold;
            }
            .map-button {
                display: inline-block;
                margin: 25px 0 0 0;
                padding: 12px 30px;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: white !important;
                font-weight: bold;
                font-size: 14px;
                border-radius: 25px;
                text-decoration: none;
                box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            }
            .map-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.2);
            }
            .footer {
                background-color: #f5f5f5;
                text-align: center;
                padding: 15px;
                font-size: 12px;
                color: #9ca3af;
            }
            @media screen and (max-width: 480px) {
                .email-container { margin: 20px 10px; }
                .header h1 { font-size: 22px; }
                .badge { padding: 4px 12px; font-size: 12px; }
                .map-button { padding: 10px 20px; font-size: 13px; }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Node ${node_info.sensor_id} <span class="badge">${status_text}</span></h1>
            </div>
            <div class="content">
                <p>Thông tin chi tiết của node:</p>
                <table>
                    <tr><th>Sensor ID</th><td>${node_info.sensor_id}</td></tr>
                    <tr><th>Khu vực</th><td>${node_info.area}</td></tr>
                    <tr><th>Vị trí</th><td>${node_info.location_name}</td></tr>
                    <tr><th>Latitude / Longitude</th><td>${node_info.latitude} / ${node_info.longitude}</td></tr>
                    <tr><th>Trạng thái</th><td>${status_text}</td></tr>
                    <tr><th>Thời gian</th><td>${new Date().toLocaleString("vi-VN")}</td></tr>
                </table>
                <div style="text-align:center;">
                    <a href="${mapsLink}" target="_blank" class="map-button">
                        Xem vị trí trên Google Maps
                    </a>
                </div>
            </div>
            <div class="footer">
                © 2025 AirQuality. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"AirQuality Notification" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Air Quality Alert: Node ${node_info.sensor_id} - ${status_text}`,
            html: htmlContent,
        });
        console.log("✅ Email đã gửi:", info.messageId);
    } catch (error) {
        console.error("❌ Lỗi gửi email:", error);
        throw error;
    }
};