import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const startTaskSchema = Joi.object({
  taskId: objectId.required()
});

export const completeTaskSchema = Joi.object({
  taskId: objectId.required()
});
