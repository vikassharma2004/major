import { z } from "zod";
import { USER_PROGRESS_STATUSES } from "../models/Progress/UserProgress.js";
import {
  objectIdSchema,
  paginationQuerySchema,
  sortOrderSchema
} from "./zod.js";

const progressStatusSchema = z.enum(USER_PROGRESS_STATUSES);

export const createProgressSchema = z.object({
  roadmapId: objectIdSchema("roadmapId"),
  moduleId: objectIdSchema("moduleId").optional(),
  taskId: objectIdSchema("taskId").optional(),
  status: progressStatusSchema.default("not-started")
});

export const updateProgressSchema = z.object({
  status: progressStatusSchema
});

export const progressIdParamsSchema = z.object({
  id: objectIdSchema("progress id")
});

export const roadmapProgressParamsSchema = z.object({
  roadmapId: objectIdSchema("roadmapId")
});

export const progressListQuerySchema = paginationQuerySchema.extend({
  roadmapId: objectIdSchema("roadmapId").optional(),
  moduleId: objectIdSchema("moduleId").optional(),
  taskId: objectIdSchema("taskId").optional(),
  status: progressStatusSchema.optional(),
  scope: z.enum(["roadmap", "module", "task"]).optional(),
  sortBy: z
    .enum(["updatedAt", "createdAt", "completedAt", "status"])
    .default("updatedAt"),
  sortOrder: sortOrderSchema
});

export const legacyTaskActionSchema = z.object({
  taskId: objectIdSchema("taskId")
});

export const completeTaskSchema = legacyTaskActionSchema;
