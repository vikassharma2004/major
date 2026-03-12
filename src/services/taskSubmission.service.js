import { TaskSubmission } from "../models/Progress/TaskSubmission.modal.js";
import { UserProgress } from "../models/Progress/UserProgress.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= SUBMIT TASK ========================= */
export const submitTask = async (userId, taskId, content) => {
  const progress = await UserProgress.findOne({ userId, taskId });

  if (!progress) {
    throw new AppError("Task not unlocked for user", 403);
  }

  if (progress.status !== "in_progress") {
    throw new AppError("Task must be in progress before submission", 400);
  }

  const existingSubmission = await TaskSubmission.findOne({
    userId,
    taskId
  });

  if (existingSubmission) {
    throw new AppError("Task already submitted", 409);
  }

  const submission = await TaskSubmission.create({
    userId,
    taskId,
    content,
    status: "submitted"
  });

  // mark task as completed (review can override later)
  progress.status = "completed";
  await progress.save();

  return submission;
};

/* ========================= REVIEW TASK (MENTOR) ========================= */
export const reviewTask = async (submissionId, status) => {
  const submission = await TaskSubmission.findById(submissionId);

  if (!submission) {
    throw new AppError("Submission not found", 404);
  }

  submission.status = status;
  await submission.save();

  return submission;
};

/* ========================= GET USER SUBMISSIONS ========================= */
export const getMyTaskSubmissions = async (userId) => {
  return TaskSubmission.find({ userId })
    .populate("taskId")
    .sort("-createdAt");
};

