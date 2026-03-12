import {
  submitProject,
  reviewProject,
  getMyProjectSubmissions
} from "../services/projectSubmission.service.js";

import {
  submitProjectSchema,
  reviewProjectSchema
} from "../validators/projectSubmission.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= SUBMIT ========================= */
export const submitProjectController = catchAsyncError(async (req, res) => {
  const { error } = submitProjectSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const submission = await submitProject(
    req.user.id,
    req.body.projectId,
    req.body.githubRepo
  );

  res.status(201).json(submission);
});

/* ========================= REVIEW (MENTOR) ========================= */
export const reviewProjectController = catchAsyncError(async (req, res) => {
  const { error } = reviewProjectSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const submission = await reviewProject(
    req.params.id,
    req.body.status
  );

  res.json(submission);
});

/* ========================= GET MY SUBMISSIONS ========================= */
export const getMyProjectSubmissionsController = catchAsyncError(
  async (req, res) => {
    const submissions = await getMyProjectSubmissions(req.user.id);
    res.json(submissions);
  }
);
