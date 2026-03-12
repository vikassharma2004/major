import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BillingPlan",
      required: true,
      index: true
    },
    periodStart: {
      type: Date,
      required: true,
      index: true
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true
    },
    aiTokensUsed: {
      type: Number,
      default: 0
    },
    aiTokensLimit: {
      type: Number,
      required: true
    },
    planExpiresAt: {
      type: Date,
      default: null
    },
    lastConsumedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

usageSchema.virtual("aiTokensRemaining").get(function () {
  return Math.max(0, (this.aiTokensLimit || 0) - (this.aiTokensUsed || 0));
});

export const Usage = mongoose.model("Usage", usageSchema);
