import mongoose from "mongoose";
const roadmapModuleSchema = new mongoose.Schema(
  {
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roadmap",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    order: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

roadmapModuleSchema.index({ roadmapId: 1, order: 1 });

export const RoadmapModule = mongoose.model(
  "RoadmapModule",
  roadmapModuleSchema
);
