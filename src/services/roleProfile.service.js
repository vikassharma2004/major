import { RoleProfile } from "../models/system/RoleProfile.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { User } from "../models/Auth/User.model.js";

export const getRoleProfileByUserId = async (userId) => {
  return RoleProfile.findOne({ userId });
};

export const listRoleProfiles = async () => {
  const profiles = await User.find().sort({ createdAt: -1 });
  return profiles;
};

export const upsertRoleProfile = async ({ userId, permissions, createdByAdmin }) => {
  const profile = await RoleProfile.findOneAndUpdate(
    { userId },
    {
      userId,
      permissions: permissions || [],
      createdByAdmin: !!createdByAdmin
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return profile;
};

export const deleteRoleProfile = async (userId) => {
  const profile = await RoleProfile.findOneAndDelete({ userId });
  if (!profile) {
    throw new AppError("Role profile not found", 404);
  }
  return profile;
};
