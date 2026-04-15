import mongoose from "mongoose";
const enrollmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    roadmapId: { type: mongoose.Schema.Types.ObjectId, ref: "Roadmap", index: true },

    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
      index: true
    },

    startedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

enrollmentSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });
enrollmentSchema.index({ userId: 1, createdAt: -1 });
enrollmentSchema.index({ roadmapId: 1, status: 1, userId: 1 });
export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
