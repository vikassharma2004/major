import { Usage } from "../models/monetization/Usage.model.js";
import { BillingPlan } from "../models/monetization/BillingPlan.model.js";
import { ensureDefaultPlans } from "./billingPlan.service.js";
import { AppError } from "../middleware/ErrorHanlder.js";

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
};

export const initializeUserUsage = async (userId) => {
  await ensureDefaultPlans();

  const existing = await Usage.findOne({ userId });
  if (existing) return existing;

  const defaultPlan = await BillingPlan.findOne({ isDefault: true });
  if (!defaultPlan) {
    throw new AppError("Default billing plan not configured", 500);
  }

  const now = new Date();
  const usage = await Usage.create({
    userId,
    planId: defaultPlan._id,
    periodStart: now,
    periodEnd: addMonths(now, 1),
    aiTokensUsed: 0,
    aiTokensLimit: defaultPlan.aiTokenLimit
  });

  return usage;
};

export const refreshUsagePeriodIfNeeded = async (usage) => {
  const now = new Date();
  if (usage.periodEnd > now) return usage;

  const newPeriodStart = now;
  const newPeriodEnd = addMonths(now, 1);

  usage.periodStart = newPeriodStart;
  usage.periodEnd = newPeriodEnd;
  usage.aiTokensUsed = 0;
  usage.lastConsumedAt = undefined;

  const plan = await BillingPlan.findById(usage.planId);
  if (plan) {
    usage.aiTokensLimit = plan.aiTokenLimit;
  }

  await usage.save();
  return usage;
};

export const getUsageForUser = async (userId) => {
  let usage = await Usage.findOne({ userId }).populate("planId");

  if (!usage) {
    usage = await initializeUserUsage(userId);
    usage = await Usage.findById(usage._id).populate("planId");
  }

  usage = await refreshUsagePeriodIfNeeded(usage);
  return usage;
};

export const consumeTokens = async (userId, tokens, reason = "ai") => {
  if (tokens <= 0) return getUsageForUser(userId);

  let usage = await getUsageForUser(userId);
  const remaining = usage.aiTokensLimit - usage.aiTokensUsed;

  if (tokens > remaining) {
    throw new AppError("AI token limit exceeded", 429);
  }

  usage.aiTokensUsed += tokens;
  usage.lastConsumedAt = new Date();
  await usage.save();

  return usage;
};

export const setUserPlan = async (userId, planId, expiresAt = null) => {
  const plan = await BillingPlan.findById(planId);
  if (!plan) {
    throw new AppError("Billing plan not found", 404);
  }

  let usage = await Usage.findOne({ userId });
  if (!usage) {
    usage = await initializeUserUsage(userId);
  }

  usage.planId = plan._id;
  usage.aiTokensLimit = plan.aiTokenLimit;
  usage.planExpiresAt = expiresAt ? new Date(expiresAt) : null;
  await usage.save();

  return usage;
};

export const getUsageSummary = async (userId) => {
  const usage = await getUsageForUser(userId);

  return {
    plan: usage.planId,
    aiTokensUsed: usage.aiTokensUsed,
    aiTokensLimit: usage.aiTokensLimit,
    aiTokensRemaining: Math.max(0, usage.aiTokensLimit - usage.aiTokensUsed),
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
    planExpiresAt: usage.planExpiresAt,
    lastConsumedAt: usage.lastConsumedAt
  };
};
