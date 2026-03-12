import express from "express";
import {
  getMyMentorProfileController,
  getMentorProfileByUserIdController,
  listMentorProfilesController,
  upsertMentorProfileController,
  verifyMentorProfileController
} from "../controllers/mentorProfile.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const MentorProfileRouter = express.Router();

MentorProfileRouter.get(
  "/",
  authenticate,
  authorizeRoles("admin"),
  listMentorProfilesController
);

MentorProfileRouter.get(
  "/me",
  authenticate,
  authorizeRoles("mentor", "admin"),
  getMyMentorProfileController
);

MentorProfileRouter.patch(
  "/me",
  authenticate,
  authorizeRoles("mentor", "admin"),
  upsertMentorProfileController
);

MentorProfileRouter.get(
  "/:userId",
  authenticate,
  getMentorProfileByUserIdController
);

MentorProfileRouter.patch(
  "/:userId/verify",
  authenticate,
  authorizeRoles("admin"),
  verifyMentorProfileController
);

export default MentorProfileRouter;
