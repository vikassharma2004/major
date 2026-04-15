import { catchAsyncError } from "../../middleware/CatchAsyncError.js";
import { validateWithZod } from "../../validators/zod.js";
import {
  generateEngineeringAIResponse,
  generateMentorAIResponse,
  generateProgressAIResponse
} from "./ai.service.js";
import {
  engineeringAIRequestSchema,
  mentorAIRequestSchema,
  progressAIRequestSchema
} from "./ai.validation.js";

export const mentorAIController = catchAsyncError(async (req, res) => {
  const payload = validateWithZod(mentorAIRequestSchema, req.body);
  const response = await generateMentorAIResponse(req.user, payload);

  res.status(200).json({
    success: true,
    mode: "mentor",
    ...response
  });
});

export const progressAIController = catchAsyncError(async (req, res) => {
  const payload = validateWithZod(progressAIRequestSchema, req.body);
  const response = await generateProgressAIResponse(req.user, payload);

  res.status(200).json({
    success: true,
    mode: "progress",
    ...response
  });
});

export const engineeringAIController = catchAsyncError(async (req, res) => {
  const payload = validateWithZod(engineeringAIRequestSchema, req.body);
  const response = await generateEngineeringAIResponse(req.user, payload);

  res.status(200).json({
    success: true,
    mode: "engineering",
    ...response
  });
});
