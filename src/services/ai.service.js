import { AIConversation } from "../models/Ai/AIConversation.modal.js";
import { AIMessage } from "../models/Ai/AIMessage.modal.js";
import { LearningContext } from "../models/Ai/LearningContext.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { geminiModel } from "../config/Aiconfig.js";
import { MASTER_SYSTEM_PROMPT } from "../ai/systemPrompt.js";
import {
  consumeTokens,
  estimateTokens,
  getUsageSummary
} from "./usage.service.js";

const DEFAULT_ASSISTANT_RESERVE = 500;

const buildPrompt = ({ conversation, contextRules, userMessage }) => {
  const contextBlock = contextRules
    ? `Learning Context Rules:\n${JSON.stringify(contextRules, null, 2)}`
    : "Learning Context Rules: none";

  return `${MASTER_SYSTEM_PROMPT}\n\n${contextBlock}\n\nConversation Purpose: ${conversation.purpose}\nRoadmap ID: ${conversation.roadmapId}\nTask ID: ${conversation.taskId || "n/a"}\n\nUser: ${userMessage}`;
};

export const createConversation = async (userId, payload) => {
  const conversation = await AIConversation.create({
    userId,
    roadmapId: payload.roadmapId,
    taskId: payload.taskId,
    purpose: payload.purpose
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

export const sendMessage = async (userId, conversationId, content, generate = true) => {
  const conversation = await AIConversation.findOne({ _id: conversationId, userId });
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  if (conversation.status === "closed") {
    throw new AppError("Conversation is closed", 400);
  }

  const usage = await getUsageSummary(userId);
  const userTokens = estimateTokens(content);
  const reserve = generate ? DEFAULT_ASSISTANT_RESERVE : 0;

  if (userTokens + reserve > usage.aiTokensRemaining) {
    throw new AppError("AI token limit exceeded", 429);
  }

  const userMessage = await AIMessage.create({
    conversationId,
    role: "user",
    content
  });

  let assistantMessage = null;
  let assistantText = null;

  if (generate) {
    const context = await LearningContext.findOne({
      userId,
      taskId: conversation.taskId
    });

    const prompt = buildPrompt({
      conversation,
      contextRules: context?.rules,
      userMessage: content
    });

    try {
      const result = await geminiModel.generateContent(prompt);
      assistantText = result.response.text().trim();
    } catch (error) {
      throw new AppError(`AI generation failed: ${error.message}`, 502);
    }

    assistantMessage = await AIMessage.create({
      conversationId,
      role: "assistant",
      content: assistantText
    });
  }

  const assistantTokens = estimateTokens(assistantText);
  const totalTokens = userTokens + assistantTokens;
  await consumeTokens(userId, totalTokens, "ai_message");

  return {
    userMessage,
    assistantMessage,
    tokensUsed: totalTokens
  };
};
