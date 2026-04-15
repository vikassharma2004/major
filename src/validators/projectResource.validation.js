import Joi from "joi";

export const createProjectResourceSchema = Joi.object({
  type: Joi.string()
    .valid("github", "youtube", "documentation", "article")
    .required(),
  title: Joi.string().min(3).max(200).required(),
  link: Joi.string().uri().required(),
  whyThisResource: Joi.string().min(10).max(500).required(),
  whenToUse: Joi.string()
    .valid("before-project", "during-project", "reference")
    .default("before-project"),
});

export const updateProjectResourceSchema = Joi.object({
  type: Joi.string().valid("github", "youtube", "documentation", "article").optional(),
  title: Joi.string().min(3).max(200).optional(),
  link: Joi.string().uri().optional(),
  whyThisResource: Joi.string().min(10).max(500).optional(),
  whenToUse: Joi.string()
    .valid("before-project", "during-project", "reference")
    .optional(),
});
