import express from "express";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  submitProjectController,
  reviewProjectController,
  getMyProjectSubmissionsController
} from "../controllers/projectSubmission.controller.js";

const ProjectSubmissionRouter = express.Router();

// POST /api/v1/project-submissions
ProjectSubmissionRouter.post("/", authenticate, submitProjectController);

// GET /api/v1/project-submissions/me
ProjectSubmissionRouter.get("/me", authenticate, getMyProjectSubmissionsController);

// PATCH /api/v1/project-submissions/:id/review
ProjectSubmissionRouter.patch(
  "/:id/review",
  authenticate,
  authorizeRoles("mentor", "admin"),
  reviewProjectController
);

export default ProjectSubmissionRouter;
