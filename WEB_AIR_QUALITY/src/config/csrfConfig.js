import csurf from 'csurf';
import cookieParser from 'cookie-parser';

export default function setupCSRF(app) {
    // Phân tích cookie
    app.use(cookieParser());
    
    // Tạo middleware CSRF
    const csrfProtection = csurf({ cookie: false }); // dùng session

    // Gắn token vào locals cho view
    app.use((req, res, next) => {
        csrfProtection(req, res, (err) => {
            if (err) return next(err);
            res.locals.csrfToken = req.csrfToken();
            next();
        });
    });
}