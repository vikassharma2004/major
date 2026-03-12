import mongoose from "mongoose";

const mentorOnboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    application: {
      expertise: [String],
      experienceYears: Number,
      bio: String,
      portfolioUrl: String,
      linkedInUrl: String,
      availability: String,
      motivation: String
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: Date,
    reviewNotes: String
  },
  { timestamps: true }
);

export const MentorOnboarding = mongoose.model(
  "MentorOnboarding",
  mentorOnboardingSchema
);
