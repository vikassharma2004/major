import express from "express";

import {
  createTaskController,
  updateTaskController,
  getTasksByModuleController,
  deleteTaskController
} from "../controllers/roadmapTask.controller.js";

import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const RoadmapTaskRouter = express.Router();

/* ========================= READ ========================= */
// Get tasks for a module
RoadmapTaskRouter.get(
  "/:moduleId/tasks",
  authenticate,
  getTasksByModuleController
);

/* ========================= WRITE ========================= */
// Create task
RoadmapTaskRouter.post(
  "/:moduleId/tasks",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createTaskController
);

// Update task
RoadmapTaskRouter.patch(
  "/tasks/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateTaskController
);

// Delete task
RoadmapTaskRouter.delete(
  "/tasks/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteTaskController
);

export default RoadmapTaskRouter;
