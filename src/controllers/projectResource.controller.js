import {
  createProjectResource,
  getResourcesByProject,
  updateProjectResource,
  deleteProjectResource,
} from "../services/projectResource.service.js";

import {
  createProjectResourceSchema,
  updateProjectResourceSchema,
} from "../validators/projectResource.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const createProjectResourceController = catchAsyncError(async (req, res) => {
  const { projectId } = req.params;
  const { error } = createProjectResourceSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const resource = await createProjectResource(req.body, req.user.id, projectId);
  res.status(201).json({ message: "Project resource created successfully", resource });
});

export const getResourcesByProjectController = catchAsyncError(async (req, res) => {
  const resources = await getResourcesByProject(req.params.projectId);
  res.json({ message: "Project resources fetched successfully", resources });
});

export const updateProjectResourceController = catchAsyncError(async (req, res) => {
  const { error } = updateProjectResourceSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const resource = await updateProjectResource(req.params.id, req.user.id, req.body);
  res.json({ message: "Project resource updated successfully", resource });
});

export const deleteProjectResourceController = catchAsyncError(async (req, res) => {
  await deleteProjectResource(req.params.id, req.user.id);
  res.json({ message: "Project resource deleted successfully" });
});
