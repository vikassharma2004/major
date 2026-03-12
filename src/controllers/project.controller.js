import {
  createProject,
  updateProject,
  getProjectsByRoadmap,
  deleteProject
} from "../services/project.service.js";

import {
  createProjectSchema,
  updateProjectSchema
} from "../validators/project.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE ========================= */
export const createProjectController = catchAsyncError(async (req, res) => {
  const {roadmapId} = req.params;
  const { error } = createProjectSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const project = await createProject(req.body, req.user.id,roadmapId);
  res.status(201).json(project);
});

/* ========================= UPDATE ========================= */
export const updateProjectController = catchAsyncError(async (req, res) => {
  const { error } = updateProjectSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const project = await updateProject(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json(project);
});

/* ========================= GET BY ROADMAP ========================= */
export const getProjectsByRoadmapController = catchAsyncError(
  async (req, res) => {
    const projects = await getProjectsByRoadmap(req.params.roadmapId);
    res.json(projects);
  }
);

/* ========================= DELETE ========================= */
export const deleteProjectController = catchAsyncError(async (req, res) => {
  await deleteProject(req.params.id, req.user.id);
  res.json({ message: "Project deleted successfully" });
});
