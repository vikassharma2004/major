import express from "express";

import {
  createModuleController,
  updateModuleController,
  getModulesByRoadmapController,
  deleteModuleController
} from "../controllers/roadmapModule.controller.js";

import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const RoadmapModuleRouter = express.Router();

/* ========================= PUBLIC / READ ========================= */

// Get all modules for a roadmap
RoadmapModuleRouter.get(
  "/:roadmapId/modules",
  authenticate, // optional: service can decide visibility
  // requireRoadmapAccess,
  getModulesByRoadmapController
);

/* ========================= PROTECTED / WRITE ========================= */

// Create module under a roadmap
RoadmapModuleRouter.post(
  "/:roadmapId/modules",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createModuleController
);

// Update module
RoadmapModuleRouter.patch(
  "/modules/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateModuleController
);

// Delete module
RoadmapModuleRouter.delete(
  "/modules/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteModuleController
);

export default RoadmapModuleRouter;
