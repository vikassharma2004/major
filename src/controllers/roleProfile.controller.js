import {
  getRoleProfileByUserId,
  listRoleProfiles,
  upsertRoleProfile,
  deleteRoleProfile
} from "../services/roleProfile.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const getMyRoleProfileController = catchAsyncError(async (req, res) => {
  const profile = await getRoleProfileByUserId(req.user.id);

  if (!profile) {
    throw new AppError("Role profile not found", 404);
  }

  res.status(200).json({ success: true, profile });
});

export const getRoleProfileByUserIdController = catchAsyncError(
  async (req, res) => {
    const profile = await getRoleProfileByUserId(req.params.userId);

    if (!profile) {
      throw new AppError("Role profile not found", 404);
    }

    res.status(200).json({ success: true, profile });
  }
);

export const listRoleProfilesController = catchAsyncError(async (req, res) => {
  const profiles = await listRoleProfiles();
  res.status(200).json({ success: true, count: profiles.length, profiles });
});

export const upsertRoleProfileController = catchAsyncError(async (req, res) => {
  const { userId, permissions } = req.body;
  if (!userId) {
    throw new AppError("userId is required", 400);
  }

  const profile = await upsertRoleProfile({
    userId,
    permissions,
    createdByAdmin: true
  });

  res.status(200).json({ success: true, profile });
});

export const updateRoleProfileController = catchAsyncError(async (req, res) => {
  const { permissions } = req.body;

  const profile = await upsertRoleProfile({
    userId: req.params.userId,
    permissions,
    createdByAdmin: true
  });

  res.status(200).json({ success: true, profile });
});

export const deleteRoleProfileController = catchAsyncError(async (req, res) => {
  await deleteRoleProfile(req.params.userId);
  res.status(200).json({ success: true, message: "Role profile deleted" });
});
