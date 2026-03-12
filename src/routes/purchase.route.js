import express from "express";
import {
  createRoadmapPurchaseController,
  listMyPurchasesController,
  getPurchaseByIdController
} from "../controllers/purchase.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";
import { writeLimiter } from "../config/security.js";

const PurchaseRouter = express.Router();

PurchaseRouter.post(
  "/roadmaps/:roadmapId",
  authenticate,
  writeLimiter,
  createRoadmapPurchaseController
);

PurchaseRouter.get("/me", authenticate, listMyPurchasesController);

PurchaseRouter.get("/:id", authenticate, getPurchaseByIdController);

export default PurchaseRouter;
