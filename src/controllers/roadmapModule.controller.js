import {
  createModule,
  updateModule,
  getModulesByRoadmap,
  deleteModule
} from "../services/roadmapModule.service.js";

import {
  createModuleSchema,
  updateModuleSchema
} from "../validators/roadmapModule.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE ========================= */
export const createModuleController = catchAsyncError(async (req, res) => {
  const {roadmapId} = req.params;
  console.log(roadmapId);
  const { error } = createModuleSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const module = await createModule(req.body, req.user.id,roadmapId);
  res.status(201).json(module);
});

/* ========================= UPDATE ========================= */
export const updateModuleController = catchAsyncError(async (req, res) => {
  const { error } = updateModuleSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const module = await updateModule(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json(module);
});

/* ========================= GET BY ROADMAP ========================= */
export const getModulesByRoadmapController = catchAsyncError(
  async (req, res) => {
    const modules = await getModulesByRoadmap(req.params.roadmapId);
    res.json(modules);
  }
);

/* ========================= DELETE ========================= */
export const deleteModuleController = catchAsyncError(async (req, res) => {
  await deleteModule(req.params.id, req.user.id);
  res.json({ message: "Module deleted successfully" });
});
