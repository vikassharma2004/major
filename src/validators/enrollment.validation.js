import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
});



export const updateEnrollmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "completed", "dropped")
    .required()
});
