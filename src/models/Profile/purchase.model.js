import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    provider: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true
    },

    orderId: {
      type: String,
      required: true,
      unique: true
    },

    paymentId: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
      index: true
    },

    purchasedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

purchaseSchema.index({ userId: 1, roadmapId: 1 });
purchaseSchema.index({ roadmapId: 1, status: 1, createdAt: -1 });
purchaseSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Purchase = mongoose.model("Purchase", purchaseSchema);
