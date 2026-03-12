import mongoose from "mongoose";

const billingPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "USD"
    },
    billingInterval: {
      type: String,
      enum: ["monthly", "yearly", "one-time"],
      default: "monthly"
    },
    aiTokenLimit: {
      type: Number,
      required: true
    },
    features: {
      type: [String],
      default: []
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

billingPlanSchema.index({ code: 1 }, { unique: true });

export const BillingPlan = mongoose.model("BillingPlan", billingPlanSchema);
