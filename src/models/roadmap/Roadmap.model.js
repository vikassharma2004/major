import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: "text"
    },

    shortDescription: {
      type: String,
      required: true
    },

    detailedDescription: {
      type: String
    },

    learningOutcomes: {
      type: [String],
      required: true
    },

    coverImage: {
      type: String, // cloudinary / s3 url
      required: true
    },

    visualOverview: {
      type: String // explains the roadmap image flow
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
domain: {
  type: String,
  enum: [
    "frontend",
    "backend",
    "fullstack",
    "mobile",
    "devops",
    "system-design",
    "data",
    "ai-ml",
    "security"
  ],
  required: true,
  index: true
}
,
    isPaid: {
      type: Boolean,
      default: false,
      index: true
    },

    price: {
      type: Number,
      default: 0
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

export const Roadmap = mongoose.model("Roadmap", roadmapSchema);
