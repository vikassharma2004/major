import { BillingPlan } from "../models/monetization/BillingPlan.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { buildCacheKey, delCache, getCache, setCache } from "../config/cache.js";

const DEFAULT_PLANS = [
  {
    name: "Free",
    code: "free",
    description: "Free starter plan with limited AI tokens.",
    price: 0,
    currency: "USD",
    billingInterval: "monthly",
    aiTokenLimit: 10000,
    features: ["Community access", "Basic AI guidance"],
    isDefault: true
  },
  {
    name: "Starter",
    code: "starter",
    description: "Higher AI token limits for active learners.",
    price: 9,
    currency: "USD",
    billingInterval: "monthly",
    aiTokenLimit: 100000,
    features: ["Priority AI guidance", "Roadmap insights"]
  },
  {
    name: "Pro",
    code: "pro",
    description: "Best for heavy AI usage and mentorship.",
    price: 29,
    currency: "USD",
    billingInterval: "monthly",
    aiTokenLimit: 500000,
    features: ["Advanced AI guidance", "Priority support", "Mentor sessions"]
  },
  {
    name: "Enterprise",
    code: "enterprise",
    description: "Enterprise-grade plan with the highest AI limits.",
    price: 99,
    currency: "USD",
    billingInterval: "monthly",
    aiTokenLimit: 1000000,
    features: ["Enterprise support", "Custom onboarding", "SLA guarantees"]
  }
];

export const ensureDefaultPlans = async () => {
  const existing = await BillingPlan.find({
    code: { $in: DEFAULT_PLANS.map((plan) => plan.code) }
  }).select("code");

  const existingCodes = new Set(existing.map((plan) => plan.code));
  const missing = DEFAULT_PLANS.filter((plan) => !existingCodes.has(plan.code));

  if (missing.length > 0) {
    await BillingPlan.insertMany(missing);
  }

  await BillingPlan.updateMany(
    { code: { $ne: "free" }, isDefault: true },
    { $set: { isDefault: false } }
  );
  await BillingPlan.updateOne({ code: "free" }, { $set: { isDefault: true } });

  return BillingPlan.find({ status: "active" }).sort({ price: 1 });
};

export const listBillingPlans = async () => {
  const cacheKey = buildCacheKey("billing:plans", ["active"]);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const plans = await ensureDefaultPlans();
  setCache(cacheKey, plans, 300);
  return plans;
};

export const getBillingPlanById = async (planId) => {
  const cacheKey = buildCacheKey("billing:plan", [planId]);
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const plan = await BillingPlan.findById(planId);
  if (!plan) {
    throw new AppError("Billing plan not found", 404);
  }

  setCache(cacheKey, plan, 300);
  return plan;
};

export const createBillingPlan = async (payload) => {
  const plan = await BillingPlan.create(payload);
  delCache(buildCacheKey("billing:plans", ["active"]));
  return plan;
};

export const updateBillingPlan = async (planId, payload) => {
  const plan = await BillingPlan.findByIdAndUpdate(planId, payload, {
    new: true
  });

  if (!plan) {
    throw new AppError("Billing plan not found", 404);
  }

  delCache(buildCacheKey("billing:plans", ["active"]));
  delCache(buildCacheKey("billing:plan", [planId]));
  return plan;
};

export const setDefaultBillingPlan = async (planId) => {
  const plan = await BillingPlan.findById(planId);
  if (!plan) {
    throw new AppError("Billing plan not found", 404);
  }

  await BillingPlan.updateMany(
    { _id: { $ne: planId }, isDefault: true },
    { $set: { isDefault: false } }
  );

  plan.isDefault = true;
  await plan.save();

  delCache(buildCacheKey("billing:plans", ["active"]));
  delCache(buildCacheKey("billing:plan", [planId]));
  return plan;
};
