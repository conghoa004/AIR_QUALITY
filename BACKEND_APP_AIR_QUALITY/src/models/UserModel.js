import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "/img/icon/user.png" },
    role: { type: String, default: "User" },
    status: { type: String, default: "Active" },
    reset_password_token: { type: String, default: null },
    reset_password_expire: { type: Date, default: null },
    expo_push_token: { type: String, default: null },
    nearest_sensor_id: { type: Number, default: null },
    notification_status: { type: Boolean, default: true },
    notification_interval: { type: Number, default: 30 },
    last_updated_nearest_sensor: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("User", userSchema);