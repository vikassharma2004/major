import express from "express";

import {
  createProjectController,
  updateProjectController,
  getProjectsByRoadmapController,
  deleteProjectController
} from "../controllers/project.controller.js";

import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const ProjectRouter = express.Router();

/* ========================= READ ========================= */

// Get all projects for a roadmap
ProjectRouter.get(
  "/:roadmapId/projects",
  authenticate,
  getProjectsByRoadmapController
);

/* ========================= WRITE ========================= */

// Create project under a roadmap
ProjectRouter.post(
  "/:roadmapId/projects",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createProjectController
);

// Update project
ProjectRouter.patch(
  "/projects/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateProjectController
);

// Delete project
ProjectRouter.delete(
  "/projects/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteProjectController
);

export default ProjectRouter;
