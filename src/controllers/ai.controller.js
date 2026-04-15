import {
  createConversation,
  listConversations,
  getConversationWithMessages,
  closeConversation,
  upsertLearningContext,
  getLearningContext,
  sendMessage
} from "../services/ai.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const createConversationController = catchAsyncError(async (req, res) => {
  const {
    roadmapId,
    taskId,
    purpose = "chat",
    storeMessages = true
  } = req.body;

  if (taskId && !roadmapId) {
    throw new AppError("roadmapId is required when taskId is provided", 400);
  }

  const conversation = await createConversation(req.user.id, {
    roadmapId,
    taskId,
    purpose,
    storeMessages
  });

  res.status(201).json({ success: true, conversation });
});

export const listConversationsController = catchAsyncError(async (req, res) => {
  const conversations = await listConversations(req.user.id);
  res.status(200).json({ success: true, count: conversations.length, conversations });
});

export const getConversationController = catchAsyncError(async (req, res) => {
  const result = await getConversationWithMessages(req.user.id, req.params.id);
  res.status(200).json({ success: true, ...result });
});

export const closeConversationController = catchAsyncError(async (req, res) => {
  const conversation = await closeConversation(req.user.id, req.params.id);
  res.status(200).json({ success: true, conversation });
});

export const upsertLearningContextController = catchAsyncError(
  async (req, res) => {
    const context = await upsertLearningContext(
      req.user.id,
      req.params.taskId,
      req.body.rules || {}
    );

    res.status(200).json({ success: true, context });
  }
);

export const getLearningContextController = catchAsyncError(async (req, res) => {
  const context = await getLearningContext(req.user.id, req.params.taskId);
  res.status(200).json({ success: true, context });
});

export const sendMessageController = catchAsyncError(async (req, res) => {
  const { content, generate, persist } = req.body;
  if (!content) {
    throw new AppError("content is required", 400);
  }

  const result = await sendMessage(
    req.user.id,
    req.params.id,
    content,
    generate !== false,
    { persist }
  );

  res.status(200).json({ success: true, ...result });
});
