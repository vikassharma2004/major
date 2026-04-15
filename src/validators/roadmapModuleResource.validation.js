import { z } from "zod";
import {
  ROADMAP_MODULE_RESOURCE_DIFFICULTIES,
  ROADMAP_MODULE_RESOURCE_LEARNING_STAGES,
  ROADMAP_MODULE_RESOURCE_TYPES
} from "../models/roadmap/RoadmapModuleResource.model.js";
import {
  objectIdSchema,
  paginationQuerySchema,
  positiveIntegerSchema,
  sortOrderSchema
} from "./zod.js";

const moduleResourceTypeSchema = z.enum(ROADMAP_MODULE_RESOURCE_TYPES);
const moduleResourceLearningStageSchema = z.enum(
  ROADMAP_MODULE_RESOURCE_LEARNING_STAGES
);
const moduleResourceDifficultySchema = z.enum(
  ROADMAP_MODULE_RESOURCE_DIFFICULTIES
);

export const moduleResourceParamsSchema = z.object({
  moduleId: objectIdSchema("moduleId")
});

export const moduleResourceIdParamsSchema = z.object({
  id: objectIdSchema("resource id")
});

export const createModuleResourceSchema = z.object({
  type: moduleResourceTypeSchema,
  title: z
    .string()
    .trim()
    .min(3, "title must be at least 3 characters")
    .max(200, "title cannot exceed 200 characters"),
  link: z.string().trim().url("link must be a valid URL"),
  description: z
    .string()
    .trim()
    .min(10, "description must be at least 10 characters")
    .max(2000, "description cannot exceed 2000 characters")
    .optional(),
  learningStage: moduleResourceLearningStageSchema.optional(),
  difficulty: moduleResourceDifficultySchema.optional(),
  estimatedTime: positiveIntegerSchema("estimatedTime").optional(),
  order: positiveIntegerSchema("order")
});

export const updateModuleResourceSchema = createModuleResourceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update"
  });

export const listModuleResourcesQuerySchema = paginationQuerySchema.extend({
  type: moduleResourceTypeSchema.optional(),
  difficulty: moduleResourceDifficultySchema.optional(),
  learningStage: moduleResourceLearningStageSchema.optional(),
  sortBy: z.enum(["order", "createdAt", "updatedAt", "title"]).default("order"),
  sortOrder: sortOrderSchema
});
