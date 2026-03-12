import {
  startTask,
  completeTask,
  getUserProgressByRoadmap
} from "../services/userProgress.service.js";

import {
  startTaskSchema,
  completeTaskSchema
} from "../validators/userProgress.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= START TASK ========================= */
export const startTaskController = catchAsyncError(async (req, res) => {
  const { error } = startTaskSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const result = await startTask(req.user.id, req.body.taskId);
  res.json(result);
});

/* ========================= COMPLETE TASK ========================= */
export const completeTaskController = catchAsyncError(async (req, res) => {
  const { error } = completeTaskSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const result = await completeTask(req.user.id, req.body.taskId);
  res.json(result);
});

/* ========================= GET PROGRESS ========================= */
export const getMyProgressController = catchAsyncError(
  async (req, res) => {
    const progress = await getUserProgressByRoadmap(
      req.user.id,
      req.params.roadmapId
    );
    res.json(progress);
  }
);


