import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";

// 1. Tạo Redis client
const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT,
    },
});

// 2. Kiểm tra kết nối
redisClient.on("error", (err) => console.error("❌ Redis Client Error:", err));
await redisClient.connect();
console.log("✅ Redis đã sẵn sàng!");

export default redisClient;