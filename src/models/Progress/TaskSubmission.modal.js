import mongoose from "mongoose";

const taskSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, index: true },
  content: String,
  status: {
    type: String,
    enum: ["submitted", "approved", "rejected"],
    index: true
  }
}, { timestamps: true });

taskSubmissionSchema.index({ userId: 1, taskId: 1 }, { unique: true });

export const TaskSubmission = mongoose.model("TaskSubmission", taskSubmissionSchema);
