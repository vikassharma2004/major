import express from "express";
import {
  createModuleResourceController,
  deleteModuleResourceController,
  getModuleResourceController,
  getModuleResourcesController,
  updateModuleResourceController
} from "../controllers/roadmapModuleResource.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const RoadmapModuleResourceRouter = express.Router();

RoadmapModuleResourceRouter.get(
  "/:moduleId/resources",
  authenticate,
  getModuleResourcesController
);

RoadmapModuleResourceRouter.get(
  "/resources/:id",
  authenticate,
  getModuleResourceController
);

RoadmapModuleResourceRouter.post(
  "/:moduleId/resources",
  authenticate,
  authorizeRoles("mentor", "admin"),
  createModuleResourceController
);

RoadmapModuleResourceRouter.patch(
  "/resources/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  updateModuleResourceController
);

RoadmapModuleResourceRouter.delete(
  "/resources/:id",
  authenticate,
  authorizeRoles("mentor", "admin"),
  deleteModuleResourceController
);

export default RoadmapModuleResourceRouter;
