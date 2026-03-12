import mongoose from "mongoose";

const mentorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    index: true
  },
  expertise: [String],
  experienceYears: Number,
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  bio: String
}, { timestamps: true });

export const MentorProfile = mongoose.model("MentorProfile", mentorProfileSchema);
