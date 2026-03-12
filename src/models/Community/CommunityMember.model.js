import mongoose from "mongoose";
const communityMemberSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ["learner", "mentor", "moderator"],
      default: "learner",
      index: true
    },

   

    joinedAt: {
      type: Date,
      default: Date.now
    },
isActive:{
      type: Boolean,
      default: true
},
    isMuted: {
      type: Boolean,
      default: false
    },
    lastReadAt: {
      type: Date
    },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityMessage"
    }
  },
  { timestamps: true }
);

communityMemberSchema.index(
  { communityId: 1, userId: 1 },
  { unique: true }
);

export const CommunityMember = mongoose.model(
  "CommunityMember",
  communityMemberSchema
);
