import {
  getMentorProfileByUserId,
  upsertMentorProfile,
  setMentorVerification,
  listMentorProfiles
} from "../services/mentorProfile.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const getMyMentorProfileController = catchAsyncError(async (req, res) => {
  const profile = await getMentorProfileByUserId(req.user.id);

  if (!profile) {
    throw new AppError("Mentor profile not found", 404);
  }

  res.status(200).json({ success: true, profile });
});

export const getMentorProfileByUserIdController = catchAsyncError(
  async (req, res) => {
    const profile = await getMentorProfileByUserId(req.params.userId);

    if (!profile) {
      throw new AppError("Mentor profile not found", 404);
    }

    res.status(200).json({ success: true, profile });
  }
);

export const listMentorProfilesController = catchAsyncError(async (req, res) => {
  const profiles = await listMentorProfiles();
  res.status(200).json({ success: true, count: profiles.length, profiles });
});

export const upsertMentorProfileController = catchAsyncError(async (req, res) => {
  const profile = await upsertMentorProfile(req.user.id, req.body);

  res.status(200).json({ success: true, profile });
});

export const verifyMentorProfileController = catchAsyncError(async (req, res) => {
  const { isVerified } = req.body;

  const profile = await setMentorVerification(req.params.userId, isVerified);

  res.status(200).json({ success: true, profile });
});
