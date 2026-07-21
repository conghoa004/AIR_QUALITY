import mongoose from "mongoose";

const NotificationAQISchema = new mongoose.Schema(
    {
        // ---- ID nghiệp vụ ----
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        sensor_id: {
            type: Number,
            required: true,
            index: true,
        },

        location: {
            type: String,
            required: true,
            index: true,
        },

        // ---- Nội dung thông báo ----
        aqi: {
            type: Number,
            required: true,
        },

        read: {
            type: Boolean,
            default: false,
            index: true,
        },

        content: {
            type: String,
            required: true,
        },

        time: {
            type: String
        },

        createdAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Unique logic:
 * 1 sensor
 * 1 địa điểm
 * => chỉ 1 notification
 */
NotificationAQISchema.index(
    {
        sensor_id: 1,
        user_id: 1,
        location: 1,
    },
    { unique: true }
);

export default mongoose.model("NotificationAQI", NotificationAQISchema);
