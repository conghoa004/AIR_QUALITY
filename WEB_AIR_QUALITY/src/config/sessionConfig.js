// src/config/session.js
import session from "express-session";
import redisClient from "./redisConfig.js";
import { RedisStore } from "connect-redis";

async function configureSession(app) {

    // 1. Tạo RedisStore
    const redisStore = new RedisStore({
        client: redisClient,
        prefix: "sess:", // tiền tố key trong Redis
    });

    // 2. Gắn session middleware
    app.use(
        session({
            store: redisStore,               // Lưu session trong Redis thay vì bộ nhớ RAM mặc định (MemoryStore)
            secret: process.env.SESSION_SECRET || "mySecretKey",
            // "secret" dùng để ký (sign) cookie session -> đảm bảo cookie không bị giả mạo

            resave: false,
            // Không lưu lại session nếu không có thay đổi gì
            // (giúp giảm tải Redis và tránh ghi đè không cần thiết)

            saveUninitialized: false,
            // Không lưu session mới nếu chưa có dữ liệu gì trong đó
            // => tránh tạo quá nhiều session rỗng trong Redis

            rolling: true,
            // Mỗi lần request -> tự động gia hạn thời gian "maxAge"
            // Giúp user không bị auto logout nếu đang hoạt động

            cookie: {
                secure: false,                // false = cho phép HTTP
                // true = chỉ hoạt động qua HTTPS (nên bật khi deploy production)

                httpOnly: true,               // Cookie chỉ có thể truy cập từ server
                // => chặn XSS (JS trên trình duyệt không đọc được cookie)

                sameSite: "lax",           // Chặn gửi cookie từ domain ngoài -> chống CSRF
                // strict = an toàn nhất nhưng có thể gây bất tiện khi nhúng iframe
                // lax = cân bằng hơn

                maxAge: 1 * 60 * 60 * 1000,   // Thời gian sống của session: 1 giờ
                // Sau thời gian này, session và cookie hết hạn
            },
        })
    );

    // Gắn session vào mọi view
    app.use((req, res, next) => {
        res.locals.session = req.session;
        next();
    });
}

export default configureSession;