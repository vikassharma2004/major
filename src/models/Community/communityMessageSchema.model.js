import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "file", "video", "audio", "link"],
      default: "file"
    },
    name: String,
    size: Number
  },
  { _id: false }
);

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const communityMessageSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    content: {
      type: String,
      default: ""
    },

    attachments: {
      type: [attachmentSchema],
      default: []
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityMessage",
      index: true
    },

    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
      }
    ],

    // Optional context
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapModule"
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoadmapTask"
    },

    messageType: {
      type: String,
      enum: ["general", "task", "system", "announcement"],
      default: "general",
      index: true
    },

    isEdited: { type: Boolean, default: false, index: true },
    editedAt: Date,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deleteReason: String,

    isPinned: { type: Boolean, default: false, index: true },
    pinnedAt: Date,
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    reactions: {
      type: [reactionSchema],
      default: []
    }
  },
  { timestamps: true }
);

communityMessageSchema.index({ communityId: 1, createdAt: -1 });
communityMessageSchema.index({ communityId: 1, isPinned: 1, pinnedAt: -1 });
communityMessageSchema.index({ communityId: 1, senderId: 1, createdAt: -1 });

export const CommunityMessage = mongoose.model(
  "CommunityMessage",
  communityMessageSchema
);
