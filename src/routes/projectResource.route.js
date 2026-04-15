import express from "express";
import {
  createProjectResourceController,
  getResourcesByProjectController,
  updateProjectResourceController,
  deleteProjectResourceController,
} from "../controllers/projectResource.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const ProjectResourceRouter = express.Router();

ProjectResourceRouter.get(
  "/:projectId/resources",
  authenticate,
  getResourcesByProjectController
);

ProjectResourceRouter.post(
  "/:projectId/resources",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createProjectResourceController
);

ProjectResourceRouter.patch(
  "/resources/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateProjectResourceController
);

ProjectResourceRouter.delete(
  "/resources/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteProjectResourceController
);

export default ProjectResourceRouter;
