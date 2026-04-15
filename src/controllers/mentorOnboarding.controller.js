import {
  submitMentorApplication,
  getMyMentorApplication,
  listMentorApplications,
  reviewMentorApplication
} from "../services/mentorOnboarding.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

export const submitMentorApplicationController = catchAsyncError(
  async (req, res) => {
    const onboarding = await submitMentorApplication(req.user.id, req.body);
    res.status(201).json({ success: true, onboarding });
  }
);

export const getMyMentorApplicationController = catchAsyncError(
  async (req, res) => {
    const onboarding = await getMyMentorApplication(req.user.id);
    res.status(200).json({ success: true, onboarding });
  }
);

export const listMentorApplicationsController = catchAsyncError(
  async (req, res) => {
    const applications = await listMentorApplications(req.query.status);
    res
      .status(200)
      .json({ success: true, count: applications.length, applications });
  }
);

export const reviewMentorApplicationController = catchAsyncError(
  async (req, res) => {
    const { action, notes } = req.body;
    if (!action) {
      throw new AppError("status is required", 400);
    }

    const onboarding = await reviewMentorApplication(
      req.params.id,
      req.user.id,
      action,
      notes
    );

    res.status(200).json({ success: true, onboarding });
  }
);
