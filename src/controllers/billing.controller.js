import {
  listBillingPlans,
  getBillingPlanById,
  createBillingPlan,
  updateBillingPlan,
  setDefaultBillingPlan
} from "../services/billingPlan.service.js";
import {
  getUsageSummary,
  setUserPlan
} from "../services/usage.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";

export const listBillingPlansController = catchAsyncError(async (req, res) => {
  const plans = await listBillingPlans();
  res.status(200).json({ success: true, count: plans.length, plans });
});

export const getBillingPlanController = catchAsyncError(async (req, res) => {
  const plan = await getBillingPlanById(req.params.id);
  res.status(200).json({ success: true, plan });
});

export const createBillingPlanController = catchAsyncError(async (req, res) => {
  const plan = await createBillingPlan(req.body);
  res.status(201).json({ success: true, plan });
});

export const updateBillingPlanController = catchAsyncError(async (req, res) => {
  const plan = await updateBillingPlan(req.params.id, req.body);
  res.status(200).json({ success: true, plan });
});

export const setDefaultBillingPlanController = catchAsyncError(
  async (req, res) => {
    const plan = await setDefaultBillingPlan(req.params.id);
    res.status(200).json({ success: true, plan });
  }
);

export const getMyUsageController = catchAsyncError(async (req, res) => {
  const usage = await getUsageSummary(req.user.id);
  res.status(200).json({ success: true, usage });
});

export const setUserPlanController = catchAsyncError(async (req, res) => {
  const usage = await setUserPlan(req.params.userId, req.body.planId);
  res.status(200).json({ success: true, usage });
});
