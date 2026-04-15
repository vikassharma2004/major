import mongoose from "mongoose";

export const USER_PROGRESS_STATUSES = [
  "not-started",
  "in-progress",
  "completed"
];

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true,
      index: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapModule",
      default: null
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTask",
      default: null
    },
    status: {
      type: String,
      enum: USER_PROGRESS_STATUSES,
      default: "not-started",
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

userProgressSchema.pre("validate", function userProgressPreValidate(next) {
  if (this.taskId && !this.moduleId) {
    this.invalidate("moduleId", "moduleId is required when taskId is provided");
  }

  if (this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== "completed") {
    this.completedAt = null;
  }

  next();
});

userProgressSchema.index({ userId: 1, roadmapId: 1 });
userProgressSchema.index(
  { userId: 1, roadmapId: 1, moduleId: 1, taskId: 1 },
  { unique: true }
);
userProgressSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const UserProgress = mongoose.model("UserProgress", userProgressSchema);
