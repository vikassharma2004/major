import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import {
  createProgress,
  completeTask,
  getProgressRecordById,
  getRoadmapProgress,
  getUserProgressByRoadmap,
  listProgressRecords,
  startTask,
  updateProgress
} from "../services/userProgress.service.js";
import {
  completeTaskSchema,
  createProgressSchema,
  legacyTaskActionSchema,
  progressIdParamsSchema,
  progressListQuerySchema,
  roadmapProgressParamsSchema,
  updateProgressSchema
} from "../validators/userProgress.validation.js";
import { validateWithZod } from "../validators/zod.js";

export const createProgressController = catchAsyncError(async (req, res) => {
  const payload = validateWithZod(createProgressSchema, req.body);
  const progress = await createProgress(req.user, payload);

  res.status(201).json({
    message: "Progress recorded successfully",
    progress
  });
});

export const updateProgressController = catchAsyncError(async (req, res) => {
  const { id } = validateWithZod(progressIdParamsSchema, req.params);
  const payload = validateWithZod(updateProgressSchema, req.body);

  const progress = await updateProgress(id, req.user, payload);

  res.status(200).json({
    message: "Progress updated successfully",
    progress
  });
});

export const getProgressRecordController = catchAsyncError(async (req, res) => {
  const { id } = validateWithZod(progressIdParamsSchema, req.params);
  const progress = await getProgressRecordById(id, req.user);

  res.status(200).json({
    message: "Progress fetched successfully",
    progress
  });
});

export const listProgressRecordsController = catchAsyncError(async (req, res) => {
  const query = validateWithZod(progressListQuerySchema, req.query);
  const result = await listProgressRecords(req.user, query);

  res.status(200).json({
    message: "Progress records fetched successfully",
    ...result
  });
});

export const getRoadmapProgressController = catchAsyncError(async (req, res) => {
  const { roadmapId } = validateWithZod(roadmapProgressParamsSchema, req.params);
  const progress = await getRoadmapProgress(req.user, roadmapId);

  res.status(200).json(progress);
});

export const startTaskController = catchAsyncError(async (req, res) => {
  const { taskId } = validateWithZod(legacyTaskActionSchema, req.body);
  const progress = await startTask(req.user, taskId);

  res.status(200).json(progress);
});

export const completeTaskController = catchAsyncError(async (req, res) => {
  const { taskId } = validateWithZod(completeTaskSchema, req.body);
  const progress = await completeTask(req.user, taskId);

  res.status(200).json(progress);
});

export const getMyProgressController = catchAsyncError(async (req, res) => {
  const { roadmapId } = validateWithZod(roadmapProgressParamsSchema, req.params);
  const progress = await getUserProgressByRoadmap(req.user, roadmapId);

  res.status(200).json(progress);
});
