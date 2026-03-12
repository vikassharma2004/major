import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const createModuleSchema = Joi.object({

  title: Joi.string().min(3).max(120).required(),

  description: Joi.string().min(10).max(1000).optional(),

  order: Joi.number().integer().min(1).required()
});

export const updateModuleSchema = Joi.object({
  title: Joi.string().min(3).max(120).optional(),
  description: Joi.string().min(10).max(1000).optional(),
  order: Joi.number().integer().min(1).optional()
});
