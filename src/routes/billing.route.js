import express from "express";
import {
  listBillingPlansController,
  getBillingPlanController,
  createBillingPlanController,
  updateBillingPlanController,
  setDefaultBillingPlanController,
  getMyUsageController,
  setUserPlanController
} from "../controllers/billing.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const BillingRouter = express.Router();

BillingRouter.get("/plans", listBillingPlansController);
BillingRouter.get("/plans/:id", getBillingPlanController);

BillingRouter.post(
  "/plans",
  authenticate,
  authorizeRoles("admin"),
  createBillingPlanController
);

BillingRouter.patch(
  "/plans/:id",
  authenticate,
  authorizeRoles("admin"),
  updateBillingPlanController
);

BillingRouter.patch(
  "/plans/:id/default",
  authenticate,
  authorizeRoles("admin"),
  setDefaultBillingPlanController
);

BillingRouter.get("/usage/me", authenticate, getMyUsageController);

BillingRouter.patch(
  "/usage/:userId/plan",
  authenticate,
  authorizeRoles("admin"),
  setUserPlanController
);

export default BillingRouter;
