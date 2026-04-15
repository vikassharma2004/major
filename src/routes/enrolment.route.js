import express from "express";
import {
  enrollController,
  getMyEnrollmentsController,
  dropEnrollmentController
} from "../controllers/enrollment.controller.js";

import { authenticate } from "../middleware/Auth.middleware.js";

const EnrollmentRouter = express.Router();

/* ========================= ENROLL ========================= */
EnrollmentRouter.post(
  "/roadmaps/:roadmapId/enroll",
  authenticate,
  enrollController
);

/* ========================= MY ENROLLMENTS ========================= */
EnrollmentRouter.get(
  "/me/enrollments",
  authenticate,
  getMyEnrollmentsController
);



/* ========================= DROP ENROLLMENT ========================= */
EnrollmentRouter.delete(
  "/roadmaps/:roadmapId/enroll",
  authenticate,
  dropEnrollmentController
);

export default EnrollmentRouter;
