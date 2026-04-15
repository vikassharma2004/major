import mongoose from "mongoose";
import { z } from "zod";
import { AppError } from "../middleware/ErrorHanlder.js";

const formatZodIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
    code: issue.code
  }));

export const validateWithZod = (schema, payload) => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new AppError("Validation failed", 400, true, {
      errors: formatZodIssues(result.error.issues)
    });
  }

  return result.data;
};

export const objectIdSchema = (fieldName = "id") =>
  z
    .string({
      required_error: `${fieldName} is required`,
      invalid_type_error: `${fieldName} must be a string`
    })
    .trim()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: `Invalid ${fieldName}`
    });

export const positiveIntegerSchema = (fieldName) =>
  z
    .coerce
    .number({
      invalid_type_error: `${fieldName} must be a number`
    })
    .int(`${fieldName} must be an integer`)
    .min(1, `${fieldName} must be at least 1`);

export const nonNegativeIntegerSchema = (fieldName) =>
  z
    .coerce
    .number({
      invalid_type_error: `${fieldName} must be a number`
    })
    .int(`${fieldName} must be an integer`)
    .min(0, `${fieldName} cannot be negative`);

export const paginationQuerySchema = z.object({
  page: positiveIntegerSchema("page").default(1),
  limit: positiveIntegerSchema("limit").max(100, "limit cannot exceed 100").default(20)
});

export const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
