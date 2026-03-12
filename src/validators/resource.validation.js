import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const createResourceSchema = Joi.object({

  type: Joi.string()
    .valid("youtube", "documentation", "github", "pdf", "article")
    .required(),

  title: Joi.string().min(3).max(150).required(),

  link: Joi.string().uri().required(),

  whyThisResource: Joi.string().min(10).max(2000).optional(),

  whenToUse: Joi.string()
    .valid("before-task", "after-task", "reference")
});

export const updateResourceSchema = Joi.object({
  type: Joi.string()
    .valid("youtube", "documentation", "github", "pdf", "article")
    .optional(),

  title: Joi.string().min(3).max(150).optional(),

  link: Joi.string().uri().optional(),

  whyThisResource: Joi.string().min(10).max(2000).optional(),

  whenToUse: Joi.string()
    .valid("before-task", "after-task", "reference")
    .optional()
});
