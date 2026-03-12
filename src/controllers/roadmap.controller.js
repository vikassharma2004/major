import {
  createRoadmap,
  updateRoadmap,
  getRoadmapById,
  getAllPublishedRoadmaps,
  togglePublishRoadmap,
  deleteRoadmap,
  getMyRoadmaps
} from "../services/roadmap.service.js";

import {
  createRoadmapSchema,
  updateRoadmapSchema
} from "../validators/roadmap.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE ========================= */
export const createRoadmapController = catchAsyncError(async (req, res) => {
  const { error } = createRoadmapSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const roadmap = await createRoadmap(req.body, req.user.id);
  res.status(201).json(roadmap);
});

export const getMyRoadmapsController = catchAsyncError(async (req, res) => {
  const roadmaps = await getMyRoadmaps(req.user.id);

  res.status(200).json({
    message:"Roadmaps fetched successfully",
    success: true,
    count: roadmaps.length,
    roadmaps
  });
});
/* ========================= UPDATE ========================= */
export const updateRoadmapController = catchAsyncError(async (req, res) => {
  const { error } = updateRoadmapSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const roadmap = await updateRoadmap(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json(roadmap);
});

/* ========================= GET SINGLE ========================= */
export const getRoadmapController = catchAsyncError(async (req, res) => {
  const roadmap = await getRoadmapById(
    req.params.id,
    req.user?.id
  );

  res.json(roadmap);
});

/* ========================= LIST PUBLISHED ========================= */
export const getPublishedRoadmapsController = catchAsyncError(
  async (req, res) => {
    const result = await getAllPublishedRoadmaps({
      page: req.query.page,
      limit: req.query.limit,
      level: req.query.level,
      isPaid: req.query.isPaid,
      title: req.query.title,
      domain: req.query.domain
    });

    res.json(result);
  }
);


/* ========================= PUBLISH / UNPUBLISH ========================= */
export const togglePublishRoadmapController = catchAsyncError(
  async (req, res) => {
    const {status,message} = await togglePublishRoadmap(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      status,
      message
    });
  }
);


/* ========================= DELETE ========================= */
export const deleteRoadmapController = catchAsyncError(async (req, res) => {
  await deleteRoadmap(req.params.id, req.user.id);
  res.json({ message: "Roadmap deleted successfully" });
});
