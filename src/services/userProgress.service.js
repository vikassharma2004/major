import { UserProgress } from "../models/Progress/UserProgress.js";
import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= START TASK ========================= */
export const startTask = async (userId, taskId) => {
  const progress = await UserProgress.findOne({ userId, taskId });

  if (!progress) {
    throw new AppError("Task not unlocked for user", 403);
  }

  if (progress.status !== "available") {
    throw new AppError("Task cannot be started", 400);
  }

  progress.status = "in_progress";
  await progress.save();

  return progress;
};

/* ========================= COMPLETE TASK ========================= */
export const completeTask = async (userId, taskId) => {
  const progress = await UserProgress.findOne({ userId, taskId });

  if (!progress || progress.status !== "in_progress") {
    throw new AppError("Task not in progress", 400);
  }

  progress.status = "completed";
  await progress.save();

  // 🔓 Unlock next task (simple version)
  const currentTask = await RoadmapTask.findById(taskId);

  const nextTask = await RoadmapTask.findOne({
    moduleId: currentTask.moduleId,
    order: { $gt: currentTask.order }
  }).sort("order");

  if (nextTask) {
    await UserProgress.findOneAndUpdate(
      { userId, taskId: nextTask._id },
      {
        userId,
        taskId: nextTask._id,
        roadmapId: progress.roadmapId,
        status: "available"
      },
      { upsert: true }
    );
  }

  return progress;
};

/* ========================= GET USER PROGRESS ========================= */
export const getUserProgressByRoadmap = async (userId, roadmapId) => {
  return UserProgress.find({ userId, roadmapId })
    .populate("taskId")
    .sort("createdAt");
};
