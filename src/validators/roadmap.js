import Joi from "joi";

export const createRoadmapSchema = Joi.object({
  title: Joi.string().min(5).max(150).required(),

  shortDescription: Joi.string().min(20).max(300).required(),

  detailedDescription: Joi.string().min(50).max(5000).optional(),

  learningOutcomes: Joi.array()
    .items(Joi.string().min(10).max(200))
    .min(3)
    .required(),

  coverImage: Joi.string().uri().required(),
  domain: Joi.string()
    .valid(
      "frontend",
    "backend",
    "fullstack",
    "mobile",
    "devops",
    "system-design",
    "data",
    "ai-ml",
    "security",
    "other"
    )
    .required(),

  visualOverview: Joi.string().min(20).max(1000).optional(),

  level: Joi.string()
    .valid("beginner", "intermediate", "advanced")
    .required(),

  isPaid: Joi.boolean().optional(),

  price: Joi.number()
    .min(0)
    .when("isPaid", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
});

export const updateRoadmapSchema = Joi.object({
  title: Joi.string().min(5).max(150).optional(),
  shortDescription: Joi.string().min(20).max(300).optional(),
  detailedDescription: Joi.string().min(50).max(5000).optional(),
  learningOutcomes: Joi.array().items(Joi.string().min(10)).optional(),
  coverImage: Joi.string().uri().optional(),
  visualOverview: Joi.string().optional(),
  level: Joi.string().valid("beginner", "intermediate", "advanced").optional(),
  isPaid: Joi.boolean().optional(),
  price: Joi.number().min(0).optional(),
  isPublished: Joi.boolean().optional()
});
