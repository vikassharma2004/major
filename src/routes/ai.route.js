import express from "express";
import {
  createConversationController,
  listConversationsController,
  getConversationController,
  closeConversationController,
  upsertLearningContextController,
  getLearningContextController,
  sendMessageController
} from "../controllers/ai.controller.js";
import { authenticate } from "../middleware/Auth.middleware.js";

const AiRouter = express.Router();

AiRouter.post("/conversations", authenticate, createConversationController);
AiRouter.get("/conversations", authenticate, listConversationsController);
AiRouter.get("/conversations/:id", authenticate, getConversationController);
AiRouter.post(
  "/conversations/:id/messages",
  authenticate,
  sendMessageController
);
AiRouter.post(
  "/conversations/:id/close",
  authenticate,
  closeConversationController
);

AiRouter.get(
  "/context/:taskId",
  authenticate,
  getLearningContextController
);
AiRouter.patch(
  "/context/:taskId",
  authenticate,
  upsertLearningContextController
);

export default AiRouter;
