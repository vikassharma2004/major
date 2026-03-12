import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});

export const submitProjectSchema = Joi.object({
  projectId: objectId.required(),
  githubRepo: Joi.string().uri().required()
});

export const reviewProjectSchema = Joi.object({
  status: Joi.string()
    .valid("approved", "rejected")
    .required()
});
