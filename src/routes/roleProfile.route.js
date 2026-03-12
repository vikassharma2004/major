import express from "express";
import {
  getMyRoleProfileController,
  getRoleProfileByUserIdController,
  listRoleProfilesController,
  upsertRoleProfileController,
  updateRoleProfileController,
  deleteRoleProfileController
} from "../controllers/roleProfile.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const RoleProfileRouter = express.Router();

RoleProfileRouter.get("/me", authenticate, getMyRoleProfileController);

RoleProfileRouter.get(
  "/",
  authenticate,
  authorizeRoles("admin"),
  listRoleProfilesController
);

RoleProfileRouter.get(
  "/:userId",
  authenticate,
  authorizeRoles("admin"),
  getRoleProfileByUserIdController
);

RoleProfileRouter.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  upsertRoleProfileController
);

RoleProfileRouter.patch(
  "/:userId",
  authenticate,
  authorizeRoles("admin"),
  updateRoleProfileController
);

RoleProfileRouter.delete(
  "/:userId",
  authenticate,
  authorizeRoles("admin"),
  deleteRoleProfileController
);

export default RoleProfileRouter;
