import { User } from "../models/Auth/User.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import bcrypt from "bcryptjs";

/* ========================= GET PROFILE ========================= */
export const getProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "-passwordHash -twoFactorSecret"
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/* ========================= UPDATE PROFILE ========================= */
export const updateProfile = async (userId, updateData) => {
  // ❌ Never allow these to be updated here
  delete updateData.passwordHash;
  delete updateData.email;
  delete updateData.status;
  delete updateData.twoFactorSecret;

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select("-passwordHash -twoFactorSecret");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/* ========================= CHANGE PASSWORD ========================= */
export const changePassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }
 // 🔐 Hash HERE
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  // let pre-save hook hash it
  user.passwordHash =hashedPassword;
  await user.save();

  return { message: "Password updated successfully" };
};

/* ========================= TOGGLE 2FA ========================= */
export const disable2FA = async (userId) => {
  const user = await User.findById(userId).select("+twoFactorSecret");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();

  return { message: "2FA disabled successfully" };
};

/* ========================= DEACTIVATE ACCOUNT ========================= */
export const deactivateAccount = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { status: "deleted" },
    { new: true }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return { message: "Account deactivated successfully" };
};
