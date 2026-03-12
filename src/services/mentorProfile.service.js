import { MentorProfile } from "../models/Profile/MentorProfile.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const getMentorProfileByUserId = async (userId) => {
  return MentorProfile.findOne({ userId });
};

export const upsertMentorProfile = async (userId, payload) => {
  const update = {
    expertise: payload.expertise,
    experienceYears: payload.experienceYears,
    bio: payload.bio
  };

  const profile = await MentorProfile.findOneAndUpdate(
    { userId },
    { $set: update, $setOnInsert: { userId } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return profile;
};

export const setMentorVerification = async (userId, isVerified) => {
  const profile = await MentorProfile.findOneAndUpdate(
    { userId },
    { $set: { isVerified: !!isVerified } },
    { new: true }
  );

  if (!profile) {
    throw new AppError("Mentor profile not found", 404);
  }

  return profile;
};

export const listMentorProfiles = async () => {
  const profiles = await MentorProfile.find().sort({ createdAt: -1 });
  return profiles;
};
