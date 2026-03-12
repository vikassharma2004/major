import mongoose from "mongoose";

const roleProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    index: true
  },

  permissions: [String], // RBAC ready

  createdByAdmin: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const RoleProfile = mongoose.model("RoleProfile", roleProfileSchema);
