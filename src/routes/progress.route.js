import express from "express";
import { authenticate } from "../middleware/Auth.middleware.js";

import {
  startTaskController,
  completeTaskController,
  getMyProgressController
} from "../controllers/userProgress.controller.js";

const ProgressRouter = express.Router();

// POST /api/v1/progress/start
ProgressRouter.post("/start", authenticate, startTaskController);

// POST /api/v1/progress/complete
ProgressRouter.post("/complete", authenticate, completeTaskController);

// GET /api/v1/progress/roadmaps/:roadmapId
ProgressRouter.get("/roadmaps/:roadmapId", authenticate, getMyProgressController);

export default ProgressRouter;
