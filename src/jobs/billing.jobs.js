import cron from "node-cron";
import logger from "../config/logger.js";
import { Usage } from "../models/monetization/Usage.model.js";
import { BillingPlan } from "../models/monetization/BillingPlan.model.js";
import { ensureDefaultPlans } from "../services/billingPlan.service.js";

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const runUsageResetJob = async () => {
  const now = new Date();
  const usages = await Usage.find({ periodEnd: { $lte: now } });

  if (usages.length === 0) return;

  for (const usage of usages) {
    const plan = await BillingPlan.findById(usage.planId);
    usage.periodStart = now;
    usage.periodEnd = addMonths(now, 1);
    usage.aiTokensUsed = 0;
    if (plan) {
      usage.aiTokensLimit = plan.aiTokenLimit;
    }
    await usage.save();
  }

  logger.info(`Usage reset job completed for ${usages.length} users`);
};

export const runBillingDegradeJob = async () => {
  await ensureDefaultPlans();
  const defaultPlan = await BillingPlan.findOne({ isDefault: true });
  if (!defaultPlan) return;

  const now = new Date();
  const archivedPlans = await BillingPlan.find({ status: "archived" }).select("_id");
  const archivedIds = archivedPlans.map((plan) => plan._id);

  const toDegrade = await Usage.find({
    $or: [
      { planExpiresAt: { $lte: now } },
      { planId: { $in: archivedIds } }
    ]
  });

  for (const usage of toDegrade) {
    usage.planId = defaultPlan._id;
    usage.aiTokensLimit = defaultPlan.aiTokenLimit;
    usage.planExpiresAt = null;
    await usage.save();
  }

  if (toDegrade.length > 0) {
    logger.warn(`Billing degrade job downgraded ${toDegrade.length} users`);
  }
};

export const startBillingJobs = () => {
  cron.schedule("0 2 * * *", () => {
    runUsageResetJob().catch((error) => {
      logger.error("Usage reset cron failed", { error: error.message });
    });
  });

  cron.schedule("0 3 * * *", () => {
    runBillingDegradeJob().catch((error) => {
      logger.error("Billing degrade cron failed", { error: error.message });
    });
  });

  logger.info("Billing cron jobs scheduled");
};
