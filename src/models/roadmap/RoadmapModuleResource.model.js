import mongoose from "mongoose";

export const ROADMAP_MODULE_RESOURCE_TYPES = [
  "youtube",
  "documentation",
  "github",
  "pdf",
  "article",
  "course"
];

export const ROADMAP_MODULE_RESOURCE_LEARNING_STAGES = [
  "prerequisite",
  "core",
  "deep-dive",
  "revision"
];

export const ROADMAP_MODULE_RESOURCE_DIFFICULTIES = [
  "beginner",
  "intermediate",
  "advanced"
];

const roadmapModuleResourceSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapModule",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ROADMAP_MODULE_RESOURCE_TYPES,
      required: true,
      index: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    link: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    learningStage: {
      type: String,
      enum: ROADMAP_MODULE_RESOURCE_LEARNING_STAGES,
      default: "core",
      index: true
    },
    difficulty: {
      type: String,
      enum: ROADMAP_MODULE_RESOURCE_DIFFICULTIES,
      index: true
    },
    estimatedTime: {
      type: Number,
      min: 1
    },
    order: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { timestamps: true }
);

roadmapModuleResourceSchema.index({ moduleId: 1, order: 1 });
roadmapModuleResourceSchema.index({
  moduleId: 1,
  type: 1,
  difficulty: 1,
  learningStage: 1
});

export const RoadmapModuleResource = mongoose.model(
  "RoadmapModuleResource",
  roadmapModuleResourceSchema
);
