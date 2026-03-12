import Joi from "joi";

export const createNotificationSchema = Joi.object({
  userId: Joi.string().required(),
  message: Joi.string().min(1).max(1000).required()
});

export const listNotificationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().truthy("true").falsy("false").default(false)
});
