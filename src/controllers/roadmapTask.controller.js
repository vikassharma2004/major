import {
  createTask,
  updateTask,
  getTasksByModule,
  deleteTask
} from "../services/roadmapTask.service.js";

import {
  createTaskSchema,
  updateTaskSchema
} from "../validators/roadmaptask.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE ========================= */
export const createTaskController = catchAsyncError(async (req, res) => {
  const { moduleId}= req.params;
  const { error } = createTaskSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const task = await createTask(req.body, req.user.id, moduleId);
  res.status(201).json(task);
});

/* ========================= UPDATE ========================= */
export const updateTaskController = catchAsyncError(async (req, res) => {
  const { error } = updateTaskSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const task = await updateTask(req.params.id, req.user.id, req.body);
  res.json(task);
});

/* ========================= GET BY MODULE ========================= */
export const getTasksByModuleController = catchAsyncError(async (req, res) => {
  const tasks = await getTasksByModule(req.params.moduleId);
  res.json(tasks);
});

/* ========================= DELETE ========================= */
export const deleteTaskController = catchAsyncError(async (req, res) => {
  await deleteTask(req.params.id, req.user.id);
  res.json({ message: "Task deleted successfully" });
});
