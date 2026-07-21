import mongoose from "mongoose";

const { Schema, model } = mongoose;

const nodeStatusSchema = new Schema({
  sensor_id: { type: Number, required: true },
  area: { type: String, required: true },
  location_name: { type: String, required: true },
  datetimeLocal: { type: Date, required: true },
  timezone: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  owner_name: { type: String, default: "" },
  provider: { type: String, default: "" },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  createdAt: { type: Date, default: Date.now }
});

const NodeStatus = model("NodeStatus", nodeStatusSchema);

export default NodeStatus;