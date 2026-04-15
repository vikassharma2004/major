import logger from "../../config/logger.js";
import { AppError } from "../../middleware/ErrorHanlder.js";
import { createAIChatCompletion, createOpenAIClient } from "../../config/Aiconfig.js";
import { Roadmap } from "../../models/roadmap/Roadmap.model.js";
import { RoadmapModule } from "../../models/roadmap/RoadmapModule.model.js";
import { RoadmapTask } from "../../models/roadmap/RoadmapTask.modal.js";
import { Resource } from "../../models/roadmap/ResourceModel.js";
import { Project } from "../../models/roadmap/ProjectModel.js";
import { RoadmapModuleResource } from "../../models/roadmap/RoadmapModuleResource.model.js";
import {
  assertRoadmapAccess,
  getRoadmapProgress
} from "../../services/userProgress.service.js";
import {
  consumeTokens,
  estimateTokens,
  getUsageSummary
} from "../../services/usage.service.js";
import {
  ENGINEERING_PROMPT,
  MENTOR_PROMPT,
  PROGRESS_PROMPT
} from "./ai.prompts.js";

const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || 20000);
const DEFAULT_RETRY_COUNT = Number(process.env.OPENROUTER_RETRY_COUNT || 2);
const DEFAULT_RETRY_DELAY_MS = Number(process.env.OPENROUTER_RETRY_DELAY_MS || 750);

const sanitizePromptText = (value, maxLength) => {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, maxLength);
};

const safeJsonStringify = (value) => JSON.stringify(value, null, 2);

const normalizeAssistantContent = (content) => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item?.text) {
          return item.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
};

const extractJsonPayload = (text) => {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch (error) {
    const startIndex = withoutFence.indexOf("{");
    const endIndex = withoutFence.lastIndexOf("}");

    if (startIndex >= 0 && endIndex > startIndex) {
      return JSON.parse(withoutFence.slice(startIndex, endIndex + 1));
    }

    throw error;
  }
};

const isRetryableError = (error) => {
  const status = error?.status || error?.response?.status;

  if (!status) {
    return true;
  }

  return [408, 409, 425, 429, 500, 502, 503, 504].includes(status);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureOpenRouterKey = () => {
  if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
    throw new AppError("OPENROUTER_API_KEY or OPENAI_API_KEY is not configured", 500);
  }

  createOpenAIClient();
};

const reserveTokensForRequest = async (userId, systemPrompt, userPrompt, maxTokens) => {
  const usageSummary = await getUsageSummary(userId);
  const promptTokens = estimateTokens(`${systemPrompt}\n${userPrompt}`);
  const reservedTokens = Math.ceil(promptTokens * 1.25) + maxTokens;

  if (reservedTokens > usageSummary.aiTokensRemaining) {
    throw new AppError("AI token limit exceeded", 429, true, {
      aiTokensRemaining: usageSummary.aiTokensRemaining,
      requestedReserve: reservedTokens
    });
  }

  return {
    usageSummary,
    promptTokens,
    reservedTokens
  };
};

const parseAIJson = (mode, text) => {
  try {
    return extractJsonPayload(text);
  } catch (error) {
    logger.warn("AI response JSON parsing failed", {
      mode,
      error: error.message,
      responsePreview: text.slice(0, 500)
    });

    return {
      summary: "AI response was returned in non-JSON format.",
      rawResponse: text
    };
  }
};

export const sendAIRequest = async ({
  userId,
  systemPrompt,
  userPrompt,
  model = DEFAULT_MODEL,
  maxTokens = 800,
  temperature = 0.2,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retries = DEFAULT_RETRY_COUNT,
  mode = "generic"
}) => {
  ensureOpenRouterKey();

  const sanitizedSystemPrompt = sanitizePromptText(systemPrompt, 12000);
  const sanitizedUserPrompt = sanitizePromptText(userPrompt, 28000);

  if (!sanitizedSystemPrompt || !sanitizedUserPrompt) {
    throw new AppError("AI prompt content is required", 400);
  }

  const { promptTokens, reservedTokens } = await reserveTokensForRequest(
    userId,
    sanitizedSystemPrompt,
    sanitizedUserPrompt,
    maxTokens
  );

  const payload = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content: sanitizedSystemPrompt
      },
      {
        role: "user",
        content: sanitizedUserPrompt
      }
    ]
  };

  let attempt = 0;
  let response;

  while (attempt <= retries) {
    try {
      response = await createAIChatCompletion({
        model,
        messages: payload.messages,
        maxTokens,
        temperature,
        timeout: timeoutMs
      });
      break;
    } catch (error) {
      const retryable = isRetryableError(error);

      if (attempt >= retries || !retryable) {
        logger.error("OpenRouter request failed", {
          mode,
          attempt: attempt + 1,
          status: error?.status || error?.response?.status,
          message: error.message,
          providerError: error?.response?.data || error?.error
        });

        throw new AppError("AI provider request failed", 502, true, {
          provider: "openrouter",
          status: error?.status || error?.response?.status || 502,
          reason:
            error?.error?.message ||
            error?.response?.data?.error?.message ||
            error?.response?.data?.message ||
            error.message
        });
      }

      await sleep(DEFAULT_RETRY_DELAY_MS * (attempt + 1));
      attempt += 1;
    }
  }

  const assistantText = normalizeAssistantContent(
    response?.choices?.[0]?.message?.content
  );

  if (!assistantText) {
    throw new AppError("AI provider returned an empty response", 502);
  }

  const providerUsage = response?.usage || {};
  const totalTokens =
    providerUsage.total_tokens ||
    Math.min(
      reservedTokens,
      estimateTokens(`${sanitizedSystemPrompt}\n${sanitizedUserPrompt}\n${assistantText}`)
    );

  await consumeTokens(userId, totalTokens, `ai_${mode}`);

  logger.info("AI request completed", {
    type: "ai_usage",
    mode,
    userId,
    provider: "openrouter",
    model: response?.model || model,
    promptTokens: providerUsage.prompt_tokens || promptTokens,
    completionTokens:
      providerUsage.completion_tokens ||
      Math.max(totalTokens - (providerUsage.prompt_tokens || promptTokens), 0),
    totalTokens
  });

  return {
    provider: "openrouter",
    model: response?.model || model,
    text: assistantText,
    usage: {
      promptTokens: providerUsage.prompt_tokens || promptTokens,
      completionTokens:
        providerUsage.completion_tokens ||
        Math.max(totalTokens - (providerUsage.prompt_tokens || promptTokens), 0),
      totalTokens
    }
  };
};

const findModuleProgress = (progress, moduleId) =>
  progress.modules.find((module) => module.moduleId.toString() === moduleId.toString()) || null;

const findTaskProgress = (progress, taskId) => {
  for (const module of progress.modules) {
    const task = module.tasks.find(
      (taskItem) => taskItem.taskId.toString() === taskId.toString()
    );

    if (task) {
      return task;
    }
  }

  return null;
};

const buildMentorContext = async (user, payload) => {
  await assertRoadmapAccess(payload.roadmapId, user.id, user.role);

  const progress = await getRoadmapProgress(user, payload.roadmapId);

  const [roadmap, modules, projects] = await Promise.all([
    Roadmap.findById(payload.roadmapId)
      .select(
        "_id title shortDescription detailedDescription learningOutcomes level domain"
      )
      .lean(),
    RoadmapModule.find({ roadmapId: payload.roadmapId })
      .select("_id title description order")
      .sort({ order: 1 })
      .lean(),
    Project.find({ roadmapId: payload.roadmapId })
      .select("_id title difficulty expectedOutcome")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  let targetModule = null;
  let targetTask = null;

  if (payload.taskId) {
    targetTask = await RoadmapTask.findById(payload.taskId)
      .select(
        "_id moduleId title description taskType expectedThinking successCriteria allowFullSolution order"
      )
      .populate({
        path: "moduleId",
        select: "_id roadmapId title description order"
      })
      .lean();

    if (!targetTask || !targetTask.moduleId) {
      throw new AppError("Roadmap task not found", 404);
    }

    if (targetTask.moduleId.roadmapId.toString() !== payload.roadmapId) {
      throw new AppError("taskId does not belong to the provided roadmapId", 400);
    }

    if (
      payload.moduleId &&
      targetTask.moduleId._id.toString() !== payload.moduleId.toString()
    ) {
      throw new AppError("taskId does not belong to the provided moduleId", 400);
    }

    targetModule = targetTask.moduleId;
  } else {
    targetModule = await RoadmapModule.findById(payload.moduleId)
      .select("_id roadmapId title description order")
      .lean();

    if (!targetModule) {
      throw new AppError("Roadmap module not found", 404);
    }

    if (targetModule.roadmapId.toString() !== payload.roadmapId) {
      throw new AppError("moduleId does not belong to the provided roadmapId", 400);
    }
  }

  const [moduleResources, taskResources] = await Promise.all([
    payload.includeResources && targetModule
      ? RoadmapModuleResource.find({ moduleId: targetModule._id })
          .select(
            "title type link description learningStage difficulty estimatedTime order"
          )
          .sort({ order: 1 })
          .limit(10)
          .lean()
      : [],
    payload.includeResources && targetTask
      ? Resource.find({ taskId: targetTask._id })
          .select("title type link whyThisResource whenToUse")
          .limit(10)
          .lean()
      : []
  ]);

  const prerequisiteModules = targetModule
    ? progress.modules
        .filter((module) => module.order < targetModule.order)
        .map((module) => ({
          moduleId: module.moduleId,
          title: module.title,
          order: module.order,
          status: module.status
        }))
    : [];

  const blockedPrerequisites = prerequisiteModules.filter(
    (module) => module.status !== "completed"
  );

  return {
    roadmap: {
      id: roadmap._id,
      title: roadmap.title,
      shortDescription: roadmap.shortDescription,
      detailedDescription: roadmap.detailedDescription,
      level: roadmap.level,
      domain: roadmap.domain,
      learningOutcomes: roadmap.learningOutcomes
    },
    targetModule: targetModule
      ? {
          id: targetModule._id,
          title: targetModule.title,
          description: targetModule.description,
          order: targetModule.order
        }
      : null,
    targetTask: targetTask
      ? {
          id: targetTask._id,
          title: targetTask.title,
          description: targetTask.description,
          taskType: targetTask.taskType,
          expectedThinking: targetTask.expectedThinking,
          successCriteria: targetTask.successCriteria,
          allowFullSolution: targetTask.allowFullSolution,
          order: targetTask.order
        }
      : null,
    moduleResources,
    taskResources,
    roadmapProjects: projects,
    roadmapProgress: progress.roadmap,
    moduleProgress: targetModule ? findModuleProgress(progress, targetModule._id) : null,
    taskProgress: targetTask ? findTaskProgress(progress, targetTask._id) : null,
    prerequisiteModules,
    blockedPrerequisites
  };
};

const buildProgressContext = async (user, payload) => {
  await assertRoadmapAccess(payload.roadmapId, user.id, user.role);

  const progress = await getRoadmapProgress(user, payload.roadmapId);
  const completedTasks = [];
  const inProgressTasks = [];
  const pendingModules = [];

  progress.modules.forEach((module) => {
    if (module.status !== "completed") {
      pendingModules.push({
        moduleId: module.moduleId,
        title: module.title,
        order: module.order,
        status: module.status,
        taskCounts: module.taskCounts
      });
    }

    module.tasks.forEach((task) => {
      const entry = {
        taskId: task.taskId,
        title: task.title,
        status: task.status,
        taskType: task.taskType,
        moduleTitle: module.title
      };

      if (task.status === "completed") {
        completedTasks.push(entry);
      } else if (task.status === "in-progress") {
        inProgressTasks.push(entry);
      }
    });
  });

  return {
    roadmap: progress.roadmap,
    completedTasks,
    pendingModules,
    inProgressTasks,
    clientReportedCompletedTaskIds: payload.completedTaskIds || [],
    clientReportedPendingModuleIds: payload.pendingModuleIds || [],
    performance: payload.performance || {}
  };
};

const buildEngineeringContext = (payload) => ({
  instruction: payload.instruction,
  includePostmanCollection: payload.includePostmanCollection,
  backendContext: payload.backendContext || "",
  architectureNotes: payload.architectureNotes || [],
  platformConventions: {
    stack: "Node.js, Express, MongoDB with Mongoose",
    architecture: "MVC plus service layer",
    validation: "Zod schemas via validateWithZod helper",
    auth: "Cookie-based JWT auth middleware",
    rateLimiting: "express-rate-limit with per-user key generation",
    errorHandling: "AppError plus centralized errorHandler middleware",
    aiUsageControl: "usage.service.js token ledger"
  }
});

export const generateMentorAIResponse = async (user, payload) => {
  const mentorContext = await buildMentorContext(user, payload);
  const userPrompt = [
    "Use the following CareerNav mentor context.",
    safeJsonStringify({
      ...mentorContext,
      learnerQuestion: payload.userQuery
    })
  ].join("\n\n");

  const aiResponse = await sendAIRequest({
    userId: user.id,
    systemPrompt: MENTOR_PROMPT,
    userPrompt,
    model: payload.model || DEFAULT_MODEL,
    maxTokens: payload.maxTokens,
    temperature: 0.15,
    mode: "mentor"
  });

  return {
    result: parseAIJson("mentor", aiResponse.text),
    usage: aiResponse.usage,
    provider: aiResponse.provider,
    model: aiResponse.model,
    context: {
      roadmapId: payload.roadmapId,
      moduleId: mentorContext.targetModule?.id || null,
      taskId: mentorContext.targetTask?.id || null,
      blockedPrerequisites: mentorContext.blockedPrerequisites.length
    }
  };
};

export const generateProgressAIResponse = async (user, payload) => {
  const progressContext = await buildProgressContext(user, payload);
  const userPrompt = [
    "Analyze the following learner progress context.",
    safeJsonStringify(progressContext)
  ].join("\n\n");

  const aiResponse = await sendAIRequest({
    userId: user.id,
    systemPrompt: PROGRESS_PROMPT,
    userPrompt,
    model: payload.model || DEFAULT_MODEL,
    maxTokens: payload.maxTokens,
    temperature: 0.2,
    mode: "progress"
  });

  return {
    result: parseAIJson("progress", aiResponse.text),
    usage: aiResponse.usage,
    provider: aiResponse.provider,
    model: aiResponse.model,
    context: {
      roadmapId: payload.roadmapId,
      completionPercentage: progressContext.roadmap.completionPercentage,
      completedTaskCount: progressContext.completedTasks.length,
      pendingModuleCount: progressContext.pendingModules.length
    }
  };
};

export const generateEngineeringAIResponse = async (user, payload) => {
  const engineeringContext = buildEngineeringContext(payload);
  const userPrompt = [
    `Authenticated user role: ${user.role}`,
    "Use the following engineering context and instruction.",
    safeJsonStringify(engineeringContext)
  ].join("\n\n");

  const aiResponse = await sendAIRequest({
    userId: user.id,
    systemPrompt: ENGINEERING_PROMPT,
    userPrompt,
    model: payload.model || DEFAULT_MODEL,
    maxTokens: payload.maxTokens,
    temperature: 0.1,
    mode: "engineering"
  });

  return {
    result: parseAIJson("engineering", aiResponse.text),
    usage: aiResponse.usage,
    provider: aiResponse.provider,
    model: aiResponse.model,
    context: {
      includePostmanCollection: payload.includePostmanCollection,
      hasBackendContext: Boolean(payload.backendContext)
    }
  };
};
