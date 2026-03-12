import mongoose from "mongoose";
import crypto from "crypto";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    tokenHash: {
      type: String,
      required: true,
      select: false
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL
    },

    used: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

/* ========================= CREATE RESET TOKEN ========================= */
passwordResetTokenSchema.statics.createResetToken = function (userId) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return {
    rawToken,
    token: this.create({
      userId,
      tokenHash,
      expiresAt
    })
  };
};

/* ========================= VERIFY RESET TOKEN ========================= */
passwordResetTokenSchema.methods.verifyToken = function (inputToken) {
  const inputHash = crypto
    .createHash("sha256")
    .update(inputToken)
    .digest("hex");

  return inputHash === this.tokenHash && !this.used;
};

export const PasswordResetToken = mongoose.model(
  "PasswordResetToken",
  passwordResetTokenSchema
);
