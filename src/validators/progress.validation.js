import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((v, h) =>
  mongoose.Types.ObjectId.isValid(v) ? v : h.message("Invalid ObjectId")
);

/* Enrollment */
export const enrollSchema = Joi.object({
  roadmapId: objectId.required()
});

/* Task Progress */
export const updateProgressSchema = Joi.object({
  taskId: objectId.required()
});

/* Task Submission */
export const taskSubmissionSchema = Joi.object({
  taskId: objectId.required(),
  content: Joi.string().min(10).required()
});

/* Project Submission */
export const projectSubmissionSchema = Joi.object({
  projectId: objectId.required(),
  githubRepo: Joi.string().uri().required()
});
