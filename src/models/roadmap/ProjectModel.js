import mongoose from "mongoose";
const projectSchema = new mongoose.Schema(
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

    problemStatement: {
      type: String,
      required: true
    },

    constraints: {
      type: [String], // forces real decisions
      required: true
    },

    expectedOutcome: {
      type: String
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      index: true
    },

    extensionIdeas: {
      type: [String] // stretch goals
    }
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
