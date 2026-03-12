import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
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

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTask",
      index: true
    },

    purpose: {
      type: String,
      enum: ["guidance", "review"],
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

export const AIConversation = mongoose.model(
  "AIConversation",
  aiConversationSchema
);
