import express from "express";

import {
  createResourceController,
  updateResourceController,
  getResourcesByTaskController,
  deleteResourceController
} from "../controllers/resource.controller.js";

import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const ResourceRouter = express.Router();

/* ========================= READ ========================= */

// Get all resources for a task
ResourceRouter.get(
  "/:taskId/resources",
  authenticate,
  getResourcesByTaskController
);

/* ========================= WRITE ========================= */

// Create resource for a task
ResourceRouter.post(
  "/:taskId/resources",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createResourceController
);

// Update resource
ResourceRouter.patch(
  "/resources/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateResourceController
);

// Delete resource
ResourceRouter.delete(
  "/resources/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteResourceController
);

export default ResourceRouter;
