// =======================
// 1. Import thư viện cần thiết
// =======================
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from "cors";

// =======================
// 2. Import các module nội bộ
// =======================
import dbConfig from './src/config/dbConfig.js';
import sessionConfig from './src/config/sessionConfig.js';
import csrfConfig from './src/config/csrfConfig.js';
import layout from 'express-ejs-layouts';
import routersConfig from './src/routers/mainRouters.js';
import { passportConfig } from './src/config/passportGoogleConfig.js';

// =======================
// 3. Cấu hình dotenv
// =======================
dotenv.config();

// =======================
// 4. Khởi tạo Express app
// =======================
const app = express();
const PORT = process.env.PORT || 3000;

// =======================
// 5. Cho phép cross-origin
// =======================
app.use(cors());

// =======================
// 6. Kết nối Database
// =======================
await dbConfig();

// =======================
// 7. Middleware cơ bản
// =======================

// 7.1 Phân tích body (form & JSON)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 7.2 Session (phải trước CSRF)
await sessionConfig(app);

// 7.3 Gắn session vào mọi view (tùy chọn, giúp EJS dùng session dễ dàng)
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// 7.4 CSRF protection (POST/PUT/DELETE)
// await csrfConfig(app);

// 7.5 Log request
app.use(morgan('dev'));

// =======================
// 8. Cấu hình EJS và file tĩnh
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(layout);
app.use(express.static(path.join(__dirname, 'src/public')));

// 8.1 Cấu hình passport Google Auth 2.0
passportConfig(app);

// =======================
// 9. Router
// =======================
routersConfig(app);

// =======================
// 10. HTTPS Server
// =======================
// const sslOptions = {
//   key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
//   cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
// };

// =======================
// 11. Khởi động server HTTPS localhost
// =======================
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`HTTPS Server đang chạy tại: https://localhost:${PORT}`);
// });

// =======================
// 12. Khởi động server HTTP deploy Render
// =======================
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});