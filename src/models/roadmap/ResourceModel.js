import mongoose from "mongoose";
const resourceSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTask",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["youtube", "documentation", "github", "pdf", "article"],
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    link: {
      type: String,
      required: true
    },

    whyThisResource: {
      type: String // mentor explains why
    },

    whenToUse: {
      type: String,
      enum: ["before-task", "after-task", "reference"],
      default: "before-task"
    }
  },
  { timestamps: true }
);

export const Resource = mongoose.model("Resource", resourceSchema);
