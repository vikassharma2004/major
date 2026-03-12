import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  message: String,
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationSchema);
