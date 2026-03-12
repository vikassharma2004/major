import Joi from "joi";

const attachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  type: Joi.string()
    .valid("image", "file", "video", "audio", "link")
    .default("file"),
  name: Joi.string().max(255).optional(),
  size: Joi.number().integer().min(0).optional()
});

export const createMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).optional(),
  attachments: Joi.array().items(attachmentSchema).max(10).optional(),
  replyTo: Joi.string().optional(),
  mentions: Joi.array().items(Joi.string()).max(50).optional(),
  moduleId: Joi.string().optional(),
  taskId: Joi.string().optional(),
  messageType: Joi.string()
    .valid("general", "task", "system", "announcement")
    .default("general")
}).or("content", "attachments");

export const editMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).optional(),
  attachments: Joi.array().items(attachmentSchema).max(10).optional()
}).or("content", "attachments");

export const listMessageQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  before: Joi.date().optional(),
  after: Joi.date().optional(),
  includeDeleted: Joi.boolean().truthy("true").falsy("false").default(false),
  pinnedOnly: Joi.boolean().truthy("true").falsy("false").default(false)
});

export const reactionSchema = Joi.object({
  emoji: Joi.string().min(1).max(20).required()
});

export const markReadSchema = Joi.object({
  messageId: Joi.string().optional()
});
