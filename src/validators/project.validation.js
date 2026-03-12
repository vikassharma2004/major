import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const createProjectSchema = Joi.object({

  title: Joi.string().min(5).max(150).required(),

  problemStatement: Joi.string().min(30).max(5000).required(),

  constraints: Joi.array()
    .items(Joi.string().min(10).max(300))
    .min(1)
    .required(),

  expectedOutcome: Joi.string().min(20).max(2000).optional(),

  difficulty: Joi.string()
    .valid("easy", "medium", "hard")
    .required(),

  extensionIdeas: Joi.array()
    .items(Joi.string().min(10).max(300))
    .optional()
});

export const updateProjectSchema = Joi.object({
  title: Joi.string().min(5).max(150).optional(),
  problemStatement: Joi.string().min(30).max(5000).optional(),
  constraints: Joi.array().items(Joi.string().min(10)).optional(),
  expectedOutcome: Joi.string().optional(),
  difficulty: Joi.string().valid("easy", "medium", "hard").optional(),
  extensionIdeas: Joi.array().items(Joi.string().min(10)).optional()
});
