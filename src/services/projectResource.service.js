import { ProjectResource } from "../models/roadmap/projectResource.js";
import { Project } from "../models/roadmap/ProjectModel.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const createProjectResource = async (data, userId, projectId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const resource = await ProjectResource.create({ ...data, projectId });
  return resource;
};

export const getResourcesByProject = async (projectId) => {
  const resources = await ProjectResource.find({ projectId }).sort({ createdAt: 1 });
  return resources;
};

export const updateProjectResource = async (resourceId, userId, data) => {
  const resource = await ProjectResource.findByIdAndUpdate(resourceId, data, {
    new: true,
    runValidators: true,
  });
  if (!resource) throw new AppError("Project resource not found", 404);
  return resource;
};

export const deleteProjectResource = async (resourceId, userId) => {
  const resource = await ProjectResource.findByIdAndDelete(resourceId);
  if (!resource) throw new AppError("Project resource not found", 404);
};
