import { ProjectSubmission } from "../models/Progress/ProjectSubmission.modal.js";
import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { Project } from "../models/roadmap/ProjectModel.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= SUBMIT PROJECT ========================= */
export const submitProject = async (userId, projectId, githubRepo) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new AppError("Project not found", 404);
  }

  const enrollment = await Enrollment.findOne({
    userId,
    roadmapId: project.roadmapId,
    status: "active"
  });

  if (!enrollment) {
    throw new AppError("User not enrolled in this roadmap", 403);
  }

  const existing = await ProjectSubmission.findOne({
    userId,
    projectId
  });

  if (existing) {
    throw new AppError("Project already submitted", 409);
  }

  const submission = await ProjectSubmission.create({
    userId,
    projectId,
    githubRepo,
    status: "submitted"
  });

  return submission;
};

/* ========================= REVIEW PROJECT (MENTOR) ========================= */
export const reviewProject = async (submissionId, status) => {
  const submission = await ProjectSubmission.findById(submissionId);

  if (!submission) {
    throw new AppError("Project submission not found", 404);
  }

  submission.status = status;
  await submission.save();

  return submission;
};

/* ========================= GET MY PROJECT SUBMISSIONS ========================= */
export const getMyProjectSubmissions = async (userId) => {
  return ProjectSubmission.find({ userId })
    .populate("projectId")
    .sort("-createdAt");
};
