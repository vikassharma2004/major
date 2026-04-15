import express from "express";
import {
  getAdminAnalyticsController,
  getLearnerAnalyticsController,
  getMentorAnalyticsController
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const AnalyticsRouter = express.Router();

AnalyticsRouter.get(
  "/learner",
  authenticate,
  authorizeRoles("learner"),
  getLearnerAnalyticsController
);

AnalyticsRouter.get(
  "/mentor",
  authenticate,
  authorizeRoles("mentor"),
  getMentorAnalyticsController
);

AnalyticsRouter.get(
  "/admin",
  authenticate,
  authorizeRoles("admin"),
  getAdminAnalyticsController
);

export default AnalyticsRouter;
