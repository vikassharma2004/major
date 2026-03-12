import express from "express";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  submitTaskController,
  reviewTaskController,
  getMyTaskSubmissionsController
} from "../controllers/taskSubmission.controller.js";

const TaskSubmissionRouter = express.Router();

// POST /api/v1/task-submissions
TaskSubmissionRouter.post("/", authenticate, submitTaskController);

// GET /api/v1/task-submissions/me
TaskSubmissionRouter.get("/me", authenticate, getMyTaskSubmissionsController);

// PATCH /api/v1/task-submissions/:id/review
TaskSubmissionRouter.patch(
  "/:id/review",
  authenticate,
  authorizeRoles("mentor", "admin"),
  reviewTaskController
);

export default TaskSubmissionRouter;
