import mongoose from "mongoose";

const projectResourceSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["github", "youtube", "documentation", "article"],
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
      type: String,
      required: true
    },

    whenToUse: {
      type: String,
      enum: ["before-project", "during-project", "reference"],
      default: "before-project"
    }
  },
  { timestamps: true }
);

projectResourceSchema.index({ projectId: 1 });

export const ProjectResource = mongoose.model(
  "ProjectResource",
  projectResourceSchema
);
