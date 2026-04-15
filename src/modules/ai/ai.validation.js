import { z } from "zod";
import { objectIdSchema } from "../../validators/zod.js";

const aiModelSchema = z
  .string({
    invalid_type_error: "model must be a string"
  })
  .trim()
  .min(1, "model cannot be empty")
  .max(120, "model cannot exceed 120 characters")
  .optional();

const aiMaxTokensSchema = z.coerce
  .number({
    invalid_type_error: "maxTokens must be a number"
  })
  .int("maxTokens must be an integer")
  .min(200, "maxTokens must be at least 200")
  .max(1600, "maxTokens cannot exceed 1600")
  .default(800);

const shortTextArraySchema = (fieldName, maxItems = 10, maxLength = 240) =>
  z
    .array(
      z
        .string({
          invalid_type_error: `${fieldName} entries must be strings`
        })
        .trim()
        .min(1, `${fieldName} entries cannot be empty`)
        .max(maxLength, `${fieldName} entries cannot exceed ${maxLength} characters`)
    )
    .max(maxItems, `${fieldName} cannot contain more than ${maxItems} items`)
    .optional()
    .default([]);

export const mentorAIRequestSchema = z
  .object({
    roadmapId: objectIdSchema("roadmapId"),
    moduleId: objectIdSchema("moduleId").optional(),
    taskId: objectIdSchema("taskId").optional(),
    userQuery: z
      .string({
        required_error: "userQuery is required",
        invalid_type_error: "userQuery must be a string"
      })
      .trim()
      .min(1, "userQuery is required")
      .max(4000, "userQuery cannot exceed 4000 characters"),
    includeResources: z.boolean().optional().default(true),
    model: aiModelSchema,
    maxTokens: aiMaxTokensSchema
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (!payload.moduleId && !payload.taskId) {
      ctx.addIssue({
        code: "custom",
        path: ["taskId"],
        message: "Either moduleId or taskId is required"
      });
    }
  });

export const progressAIRequestSchema = z
  .object({
    roadmapId: objectIdSchema("roadmapId"),
    completedTaskIds: z
      .array(objectIdSchema("completedTaskId"))
      .max(200, "completedTaskIds cannot contain more than 200 items")
      .optional(),
    pendingModuleIds: z
      .array(objectIdSchema("pendingModuleId"))
      .max(100, "pendingModuleIds cannot contain more than 100 items")
      .optional(),
    performance: z
      .object({
        selfAssessment: z
          .string({
            invalid_type_error: "performance.selfAssessment must be a string"
          })
          .trim()
          .max(1500, "performance.selfAssessment cannot exceed 1500 characters")
          .optional(),
        blockers: shortTextArraySchema("performance.blockers", 10, 240),
        recentWins: shortTextArraySchema("performance.recentWins", 10, 240),
        consistencyScore: z
          .number({
            invalid_type_error: "performance.consistencyScore must be a number"
          })
          .min(0, "performance.consistencyScore cannot be negative")
          .max(100, "performance.consistencyScore cannot exceed 100")
          .optional(),
        averageStudyHoursPerWeek: z
          .number({
            invalid_type_error:
              "performance.averageStudyHoursPerWeek must be a number"
          })
          .min(0, "performance.averageStudyHoursPerWeek cannot be negative")
          .max(168, "performance.averageStudyHoursPerWeek cannot exceed 168")
          .optional()
      })
      .strict()
      .optional()
      .default({}),
    model: aiModelSchema,
    maxTokens: aiMaxTokensSchema
  })
  .strict();

export const engineeringAIRequestSchema = z
  .object({
    instruction: z
      .string({
        required_error: "instruction is required",
        invalid_type_error: "instruction must be a string"
      })
      .trim()
      .min(1, "instruction is required")
      .max(5000, "instruction cannot exceed 5000 characters"),
    backendContext: z
      .string({
        invalid_type_error: "backendContext must be a string"
      })
      .trim()
      .max(25000, "backendContext cannot exceed 25000 characters")
      .optional(),
    architectureNotes: shortTextArraySchema("architectureNotes", 20, 300),
    includePostmanCollection: z.boolean().optional().default(true),
    model: aiModelSchema,
    maxTokens: z.coerce
      .number({
        invalid_type_error: "maxTokens must be a number"
      })
      .int("maxTokens must be an integer")
      .min(300, "maxTokens must be at least 300")
      .max(1800, "maxTokens cannot exceed 1800")
      .default(1000)
  })
  .strict();
