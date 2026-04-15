import express from "express";
import { authenticate } from "../../middleware/Auth.middleware.js";
import { aiLimiter } from "../../config/security.js";
import {
  engineeringAIController,
  mentorAIController,
  progressAIController
} from "./ai.controller.js";

const enterpriseAiRouter = express.Router();

enterpriseAiRouter.post("/mentor", authenticate, aiLimiter, mentorAIController);
enterpriseAiRouter.post("/progress", authenticate, aiLimiter, progressAIController);
enterpriseAiRouter.post(
  "/engineering",
  authenticate,
  aiLimiter,
  engineeringAIController
);

export default enterpriseAiRouter;
