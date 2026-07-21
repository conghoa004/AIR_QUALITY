import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

function passportConfig(app) {
    // Cấu hình passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Cấu hình Google OAuth
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL
    }, (accessToken, refreshToken, profile, done) => {
        // Ở đây bạn có thể lưu user vào DB
        return done(null, profile);
    }));

    // Lưu thông tin người dùng vào sesion
    passport.serializeUser((user, done) => {
        // Có thể xử lý trước khi lưu vào session
        done(null, user);
    });

    // Lấy thông tin người dùng từ sesion
    passport.deserializeUser((obj, done) => {
        done(null, obj);
    });
}

export { passportConfig };