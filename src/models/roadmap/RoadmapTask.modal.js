import mongoose from "mongoose";
const roadmapTaskSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapModule",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    taskType: {
      type: String,
      enum: ["concept", "implementation", "debugging", "decision"],
      required: true,
      index: true
    },

    expectedThinking: {
      type: String // forces reasoning, not copy-paste
    },

    successCriteria: {
      type: [String], // clear completion rules
      required: true
    },

    allowFullSolution: {
      type: Boolean,
      default: false
    },

    order: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

roadmapTaskSchema.index({ moduleId: 1, order: 1 });

export const RoadmapTask = mongoose.model(
  "RoadmapTask",
  roadmapTaskSchema
);
