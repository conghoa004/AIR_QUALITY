import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true, // để query nhanh theo userId
    },
    sessionId: {
        type: String,
        required: true,
        unique: true, // mỗi sessionId duy nhất
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 1, // TTL: session tự xoá sau 1 ngày (nếu muốn)
    },
});

const SessionModel = mongoose.model("Session", sessionSchema);

export default SessionModel;
