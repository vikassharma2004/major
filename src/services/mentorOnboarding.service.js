import { MentorOnboarding } from "../models/Profile/MentorOnboarding.model.js";
import { MentorProfile } from "../models/Profile/MentorProfile.js";
import { User } from "../models/Auth/User.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const submitMentorApplication = async (userId, payload) => {
  const existing = await MentorOnboarding.findOne({ userId });

  if (existing && existing.status === "approved") {
    throw new AppError("Mentor application already approved", 400);
  }

  const application = {
    expertise: payload.expertise || [],
    experienceYears: payload.experienceYears,
    bio: payload.bio,
    portfolioUrl: payload.portfolioUrl,
    linkedInUrl: payload.linkedInUrl,
    availability: payload.availability,
    motivation: payload.motivation
  };

  const onboarding = await MentorOnboarding.findOneAndUpdate(
    { userId },
    { $set: { application, status: "pending" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return onboarding;
};

export const getMyMentorApplication = async (userId) => {
  return MentorOnboarding.findOne({ userId });
};

export const listMentorApplications = async (status) => {
  const query = status ? { status } : {};
  return MentorOnboarding.find(query).sort({ createdAt: -1 });
};

export const reviewMentorApplication = async (applicationId, reviewerId, status, notes) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new AppError("Invalid review status", 400);
  }

  const onboarding = await MentorOnboarding.findById(applicationId);
  if (!onboarding) {
    throw new AppError("Mentor application not found", 404);
  }

  onboarding.status = status;
  onboarding.reviewedBy = reviewerId;
  onboarding.reviewedAt = new Date();
  onboarding.reviewNotes = notes;
  await onboarding.save();

  if (status === "approved") {
    await User.findByIdAndUpdate(onboarding.userId, { role: "mentor" });

    await MentorProfile.findOneAndUpdate(
      { userId: onboarding.userId },
      {
        $set: {
          expertise: onboarding.application?.expertise || [],
          experienceYears: onboarding.application?.experienceYears,
          bio: onboarding.application?.bio,
          isVerified: true
        },
        $setOnInsert: { userId: onboarding.userId }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  return onboarding;
};
