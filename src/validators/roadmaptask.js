import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const createTaskSchema = Joi.object({
 

  title: Joi.string().min(5).max(150).required(),

  description: Joi.string().min(20).max(2000).required(),

  taskType: Joi.string()
    .valid("concept", "implementation", "debugging", "decision")
    .required(),

  expectedThinking: Joi.string().min(20).max(2000).optional(),

  successCriteria: Joi.array()
    .items(Joi.string().min(10).max(300))
    .min(1)
    .required(),

  allowFullSolution: Joi.boolean(),

  order: Joi.number().integer().min(1).required()
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(5).max(150).optional(),
  description: Joi.string().min(20).max(2000).optional(),
  taskType: Joi.string()
    .valid("concept", "implementation", "debugging", "decision")
    .optional(),
  expectedThinking: Joi.string().optional(),
  successCriteria: Joi.array().items(Joi.string().min(10)).optional(),
  allowFullSolution: Joi.boolean().optional(),
  order: Joi.number().integer().min(1).optional()
});
