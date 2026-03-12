import mongoose from "mongoose";

const projectSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, index: true },
  githubRepo: String,
  status: {
    type: String,
    enum: ["submitted", "approved", "rejected"],
    index: true
  }
}, { timestamps: true });

export const ProjectSubmission = mongoose.model("ProjectSubmission", projectSubmissionSchema);
