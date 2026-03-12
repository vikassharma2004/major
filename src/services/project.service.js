import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { Project } from "../models/roadmap/ProjectModel.js";
/* ========================= CREATE PROJECT ========================= */
export const createProject = async (data, mentorId, roadmapId) => {
  const roadmap = await Roadmap.findById(roadmapId);

  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  if (roadmap.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to add project to this roadmap", 403);
  }

  const project=await Project.create({
    roadmapId,
    title: data.title,
    problemStatement: data.problemStatement,
    constraints: data.constraints,
    expectedOutcome: data.expectedOutcome,
    difficulty: data.difficulty,
    extensionIdeas: data.extensionIdeas

  })

  return project;
};

/* ========================= UPDATE PROJECT ========================= */
export const updateProject = async (projectId, mentorId, updateData) => {
  const project = await Project.findById(projectId).populate("roadmapId");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to update this project", 403);
  }

  Object.assign(project, updateData);
  await project.save();

  return project;
};

/* ========================= GET PROJECTS BY ROADMAP ========================= */
export const getProjectsByRoadmap = async (roadmapId) => {
  return Project.find({ roadmapId }).sort("createdAt");
};

/* ========================= DELETE PROJECT ========================= */
export const deleteProject = async (projectId, mentorId) => {
  const project = await Project.findById(projectId).populate("roadmapId");

  if (!project) {
    throw new AppError("Project not found", 404);
  }

  if (project.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to delete this project", 403);
  }

  await project.deleteOne();
};
