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
      default: null,
      index: true
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTask",
      index: true
    },

    purpose: {
      type: String,
      enum: ["guidance", "review", "chat", "analysis"],
      default: "chat",
      index: true
    },

    storeMessages: {
      type: Boolean,
      default: true
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

aiConversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const AIConversation = mongoose.model(
  "AIConversation",
  aiConversationSchema
);
