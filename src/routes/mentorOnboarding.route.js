import express from "express";
import {
  submitMentorApplicationController,
  getMyMentorApplicationController,
  listMentorApplicationsController,
  reviewMentorApplicationController
} from "../controllers/mentorOnboarding.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { writeLimiter } from "../config/security.js";

const MentorOnboardingRouter = express.Router();

MentorOnboardingRouter.post(
  "/apply",
  authenticate,
  writeLimiter,
  submitMentorApplicationController
);

MentorOnboardingRouter.get(
  "/me",
  authenticate,
  getMyMentorApplicationController
);

MentorOnboardingRouter.get(
  "/",
  authenticate,
  authorizeRoles("admin"),
  listMentorApplicationsController
);

MentorOnboardingRouter.patch(
  "/:id/review",
  authenticate,
  authorizeRoles("admin"),
  reviewMentorApplicationController
);

export default MentorOnboardingRouter;
