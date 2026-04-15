import express from "express";

import {
  createRoadmapController,
  createFullRoadmap,
  updateRoadmapController,
  getRoadmapController,
  getPublishedRoadmapsController,
  togglePublishRoadmapController,
  deleteRoadmapController,
  getMyRoadmapsController
} from "../controllers/roadmap.controller.js";

import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const RoadmapRouter = express.Router();

/* ========================= PUBLIC ROUTES ========================= */

RoadmapRouter.get(
  "/me",
  authenticate,
  authorizeRoles("mentor", "admin"),
  getMyRoadmapsController
);
// List all published roadmaps
RoadmapRouter.get(
  "/",
  getPublishedRoadmapsController
);

// Get single roadmap (published OR owned by user)
RoadmapRouter.get(
  "/:id",
  authenticate, // optional access logic handled in service
  getRoadmapController
);

/* ========================= PROTECTED ROUTES ========================= */

// Create roadmap (mentor / admin)
RoadmapRouter.post(
  "/full-create",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createFullRoadmap
);

RoadmapRouter.post(
  "/",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createRoadmapController
);

// Update roadmap
RoadmapRouter.patch(
  "/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateRoadmapController
);

// Publish / Unpublish roadmap
RoadmapRouter.patch(
  "/:id/publish",
  authenticate,
  authorizeRoles("mentor", "admin"),
  togglePublishRoadmapController
);

// Delete roadmap
RoadmapRouter.delete(
  "/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteRoadmapController
);

export default RoadmapRouter;
