import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  roadmapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Roadmap",
    required: true,
    unique: true,          // 🔴 one community per roadmap
    index: true
  },

  name: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["public", "private"],
    default: "private",
    index: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },

  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

export const Community = mongoose.model("Community", communitySchema);
