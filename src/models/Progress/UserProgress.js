import mongoose from "mongoose";
const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, index: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, index: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, index: true },

    status: {
      type: String,
      enum: ["locked", "available", "in_progress", "completed"],
      default: "locked",
      index: true
    }
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, taskId: 1 }, { unique: true });
export const UserProgress = mongoose.model("UserProgress", userProgressSchema);