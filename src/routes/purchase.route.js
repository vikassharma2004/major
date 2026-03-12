import express from "express";
import {
  createRoadmapPurchaseController,
  listMyPurchasesController,
  getPurchaseByIdController
} from "../controllers/purchase.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";

const PurchaseRouter = express.Router();

PurchaseRouter.post(
  "/roadmaps/:roadmapId",
  authenticate,
  createRoadmapPurchaseController
);

PurchaseRouter.get("/me", authenticate, listMyPurchasesController);

PurchaseRouter.get("/:id", authenticate, getPurchaseByIdController);

export default PurchaseRouter;
