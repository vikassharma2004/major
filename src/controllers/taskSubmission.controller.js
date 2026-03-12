import {
  submitTask,
  reviewTask,
  getMyTaskSubmissions
} from "../services/taskSubmission.service.js";

import {
  submitTaskSchema,
  reviewTaskSchema
} from "../validators/taskSubmission.Validations.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= SUBMIT ========================= */
export const submitTaskController = catchAsyncError(async (req, res) => {
  const { error } = submitTaskSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const submission = await submitTask(
    req.user.id,
    req.body.taskId,
    req.body.content
  );

  res.status(201).json(submission);
});

/* ========================= REVIEW (MENTOR) ========================= */
export const reviewTaskController = catchAsyncError(async (req, res) => {
  const { error } = reviewTaskSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const submission = await reviewTask(
    req.params.id,
    req.body.status
  );

  res.json(submission);
});

/* ========================= GET MY SUBMISSIONS ========================= */
export const getMyTaskSubmissionsController = catchAsyncError(
  async (req, res) => {
    const submissions = await getMyTaskSubmissions(req.user.id);
    res.json(submissions);
  }
);

