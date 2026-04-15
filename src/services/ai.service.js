import { AIConversation } from "../models/Ai/AIConversation.modal.js";
import { AIMessage } from "../models/Ai/AIMessage.modal.js";
import { LearningContext } from "../models/Ai/LearningContext.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { MASTER_SYSTEM_PROMPT } from "../ai/systemPrompt.js";
import {
  estimateTokens
} from "./usage.service.js";
import { sendAIRequest } from "../modules/ai/ai.service.js";

const DEFAULT_CHAT_MAX_TOKENS = Number(
  process.env.OPENROUTER_CHAT_MAX_TOKENS || 900
);
const MAX_HISTORY_MESSAGES = 12;

const buildSystemPrompt = ({ conversation, contextRules }) => {
  const contextBlock = contextRules
    ? `Learning Context Rules:\n${JSON.stringify(contextRules, null, 2)}`
    : "Learning Context Rules: none";

  return `${MASTER_SYSTEM_PROMPT}\n\n${contextBlock}\n\nConversation Purpose: ${conversation.purpose}\nStore Messages: ${conversation.storeMessages}\nRoadmap ID: ${conversation.roadmapId || "n/a"}\nTask ID: ${conversation.taskId || "n/a"}`;
};

export const createConversation = async (userId, payload) => {
  const conversation = await AIConversation.create({
    userId,
    roadmapId: payload.roadmapId || null,
    taskId: payload.taskId,
    purpose: payload.purpose || "chat",
    storeMessages: payload.storeMessages !== false
  });

  return conversation;
};

export const listConversations = async (userId) => {
  const conversations = await AIConversation.find({ userId }).sort({ updatedAt: -1 });
  return conversations;
};

export const getConversationWithMessages = async (userId, conversationId) => {
  const conversation = await AIConversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  const messages = await AIMessage.find({ conversationId }).sort({ createdAt: 1 });

  return { conversation, messages };
};

export const closeConversation = async (userId, conversationId) => {
  const conversation = await AIConversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { $set: { status: "closed" } },
    { new: true }
  );

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  return conversation;
};

export const upsertLearningContext = async (userId, taskId, rules) => {
  const context = await LearningContext.findOneAndUpdate(
    { userId, taskId },
    { $set: { rules } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return context;
};

export const getLearningContext = async (userId, taskId) => {
  const context = await LearningContext.findOne({ userId, taskId });
  return context;
};

const buildConversationPrompt = ({
  conversation,
  historyMessages,
  userMessage,
  contextRules
}) => {
  const historyBlock = historyMessages.length
    ? historyMessages
        .map(
          (message) =>
            `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`
        )
        .join("\n")
    : "No prior stored messages.";

  return [
    "Conversation Context:",
    JSON.stringify(
      {
        purpose: conversation.purpose,
        roadmapId: conversation.roadmapId || null,
        taskId: conversation.taskId || null,
        storeMessages: conversation.storeMessages
      },
      null,
      2
    ),
    "",
    contextRules
      ? `Learning Context Rules:\n${JSON.stringify(contextRules, null, 2)}`
      : "Learning Context Rules: none",
    "",
    `Recent Conversation History:\n${historyBlock}`,
    "",
    `Latest User Message:\n${contentSanitizer(userMessage)}`
  ].join("\n");
};

const contentSanitizer = (value) =>
  String(value)
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 6000);

const buildEphemeralMessage = (conversationId, role, content) => ({
  _id: null,
  conversationId,
  role,
  content,
  createdAt: new Date(),
  updatedAt: new Date()
});

export const sendMessage = async (
  userId,
  conversationId,
  content,
  generate = true,
  options = {}
) => {
  const conversation = await AIConversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.status === "closed") {
    throw new AppError("Conversation is closed", 400);
  }

  const sanitizedContent = contentSanitizer(content);
  if (!sanitizedContent) {
    throw new AppError("content is required", 400);
  }

  const shouldPersist =
    typeof options.persist === "boolean"
      ? options.persist
      : conversation.storeMessages !== false;

  const historyMessages = await AIMessage.find({ conversationId })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES)
    .lean();

  historyMessages.reverse();

  const userMessage = shouldPersist
    ? await AIMessage.create({
        conversationId,
        role: "user",
        content: sanitizedContent
      })
    : buildEphemeralMessage(conversationId, "user", sanitizedContent);

  let assistantMessage = null;
  let assistantText = null;
  let tokensUsed = 0;

  if (generate) {
    const context = conversation.taskId
      ? await LearningContext.findOne({
          userId,
          taskId: conversation.taskId
        })
      : null;

    const systemPrompt = buildSystemPrompt({
      conversation,
      contextRules: context?.rules
    });
    const userPrompt = buildConversationPrompt({
      conversation,
      historyMessages,
      userMessage: sanitizedContent,
      contextRules: context?.rules
    });

    const aiResponse = await sendAIRequest({
      userId,
      systemPrompt,
      userPrompt,
      model: process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_MODEL,
      maxTokens: DEFAULT_CHAT_MAX_TOKENS,
      temperature: conversation.purpose === "chat" ? 0.35 : 0.2,
      mode: "conversation"
    });

    assistantText = aiResponse.text;
    tokensUsed = aiResponse.usage.totalTokens;

    assistantMessage = shouldPersist
      ? await AIMessage.create({
          conversationId,
          role: "assistant",
          content: assistantText
        })
      : buildEphemeralMessage(conversationId, "assistant", assistantText);
  }

  return {
    userMessage,
    assistantMessage,
    stored: shouldPersist,
    tokensUsed: tokensUsed || estimateTokens(assistantText)
  };
};
