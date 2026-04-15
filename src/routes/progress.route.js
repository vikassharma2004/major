import express from "express";
import { authenticate } from "../middleware/Auth.middleware.js";

import {
  createProgressController,
  getProgressRecordController,
  getRoadmapProgressController,
  listProgressRecordsController,
  startTaskController,
  completeTaskController,
  getMyProgressController,
  updateProgressController
} from "../controllers/userProgress.controller.js";

const ProgressRouter = express.Router();

ProgressRouter.post("/", authenticate, createProgressController);
ProgressRouter.get("/", authenticate, listProgressRecordsController);
ProgressRouter.get("/records/:id", authenticate, getProgressRecordController);

// Compatibility endpoints
ProgressRouter.post("/start", authenticate, startTaskController);
ProgressRouter.post("/complete", authenticate, completeTaskController);
ProgressRouter.get("/roadmaps/:roadmapId", authenticate, getMyProgressController);

// New aggregate endpoint
ProgressRouter.get("/:roadmapId", authenticate, getRoadmapProgressController);
ProgressRouter.patch("/:id", authenticate, updateProgressController);

export default ProgressRouter;
