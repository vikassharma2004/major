import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const submitTaskSchema = Joi.object({
  taskId: objectId.required(),
  content: Joi.string().min(20).max(10000).required()
});

export const reviewTaskSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required()
});
