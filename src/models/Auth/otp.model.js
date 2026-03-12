import mongoose from "mongoose";
import crypto from "crypto";

const otpTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    otpHash: {
      type: String,
      required: true,
      select: false
    },

    purpose: {
      type: String,
      enum: ["email_verification", "login", "sensitive_action"],
      required: true,
      index: true
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index
    },

    used: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

otpTokenSchema.statics.createOtp = async function (userId, purpose) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpHash = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const token = await this.create({
    userId,
    otpHash,
    purpose,
    expiresAt
  });

  return { otp, token };
};

/* ========================= VERIFY OTP ========================= */
otpTokenSchema.methods.verifyOtp = async function (inputOtp) {
  if (this.used) return false;
  if (this.expiresAt < new Date()) return false;

  const inputHash = crypto
    .createHash("sha256")
    .update(inputOtp)
    .digest("hex");

  if (inputHash !== this.otpHash) return false;

  this.used = true;
  await this.save();

  return true;
};

export const OtpToken = mongoose.model("OtpToken", otpTokenSchema);
