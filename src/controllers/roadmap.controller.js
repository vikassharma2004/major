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
import mongoose from "mongoose";
import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
import { Resource } from "../models/roadmap/ResourceModel.js";
import { Project } from "../models/roadmap/ProjectModel.js";
import { ProjectResource } from "../models/roadmap/projectResource.js";
import { RoadmapModuleResource } from "../models/roadmap/RoadmapModuleResource.model.js";

const validateFullRoadmapPayload = (body) => {
  const { modules, projects } = body;

  if (!Array.isArray(modules) || modules.length === 0) {
    throw new AppError("At least 1 module is required", 400);
  }

  if (!Array.isArray(projects) || projects.length === 0) {
    throw new AppError("At least 1 project is required", 400);
  }

  modules.forEach((moduleItem, moduleIndex) => {
    if (!Array.isArray(moduleItem.tasks) || moduleItem.tasks.length === 0) {
      throw new AppError(
        `Module at index ${moduleIndex} must contain at least 1 task`,
        400
      );
    }

    moduleItem.tasks.forEach((taskItem, taskIndex) => {
      if (!Array.isArray(taskItem.resources) || taskItem.resources.length === 0) {
        throw new AppError(
          `Task at index ${taskIndex} in module ${moduleIndex} must contain at least 1 resource`,
          400
        );
      }
    });
  });

  projects.forEach((projectItem, projectIndex) => {
    if (
      !Array.isArray(projectItem.resources) ||
      projectItem.resources.length === 0
    ) {
      throw new AppError(
        `Project at index ${projectIndex} must contain at least 1 resource`,
        400
      );
    }
  });
};

const buildFullRoadmapDocuments = (body, userId) => {
  const { modules, projects, ...roadmapPayload } = body;
  const roadmapId = new mongoose.Types.ObjectId();

  const roadmapDocument = {
    _id: roadmapId,
    ...roadmapPayload,
    createdBy: userId
  };

  const moduleDocuments = [];
  const taskDocuments = [];
  const resourceDocuments = [];
  const moduleResourceDocuments = [];
  const projectDocuments = [];
  const projectResourceDocuments = [];

  modules.forEach((moduleItem) => {
    const { tasks = [], resources = [], ...modulePayload } = moduleItem;
    const moduleId = new mongoose.Types.ObjectId();

    moduleDocuments.push({
      _id: moduleId,
      ...modulePayload,
      roadmapId
    });

    resources.forEach((resourceItem) => {
      moduleResourceDocuments.push({
        _id: new mongoose.Types.ObjectId(),
        ...resourceItem,
        moduleId
      });
    });

    tasks.forEach((taskItem) => {
      const { resources, ...taskPayload } = taskItem;
      const taskId = new mongoose.Types.ObjectId();

      taskDocuments.push({
        _id: taskId,
        ...taskPayload,
        moduleId
      });

      resources.forEach((resourceItem) => {
        resourceDocuments.push({
          _id: new mongoose.Types.ObjectId(),
          ...resourceItem,
          taskId
        });
      });
    });
  });

  projects.forEach((projectItem) => {
    const { resources, ...projectPayload } = projectItem;
    const projectId = new mongoose.Types.ObjectId();

    projectDocuments.push({
      _id: projectId,
      ...projectPayload,
      roadmapId
    });

    resources.forEach((resourceItem) => {
      projectResourceDocuments.push({
        _id: new mongoose.Types.ObjectId(),
        ...resourceItem,
        projectId
      });
    });
  });

  return {
    roadmapDocument,
    moduleDocuments,
    taskDocuments,
    resourceDocuments,
    moduleResourceDocuments,
    projectDocuments,
    projectResourceDocuments
  };
};

/* ========================= CREATE ========================= */
export const createRoadmapController = catchAsyncError(async (req, res) => {
  const { error } = createRoadmapSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const roadmap = await createRoadmap(req.body, req.user.id);
  res.status(201).json(roadmap);
});

export const createFullRoadmap = catchAsyncError(async (req, res) => {
  validateFullRoadmapPayload(req.body);

  const {
    roadmapDocument,
    moduleDocuments,
    taskDocuments,
    resourceDocuments,
    moduleResourceDocuments,
    projectDocuments,
    projectResourceDocuments
  } = buildFullRoadmapDocuments(req.body, req.user.id);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    await Roadmap.create([roadmapDocument], { session });

    if (moduleDocuments.length > 0) {
      await RoadmapModule.insertMany(moduleDocuments, { session });
    }

    if (taskDocuments.length > 0) {
      await RoadmapTask.insertMany(taskDocuments, { session });
    }

    if (resourceDocuments.length > 0) {
      await Resource.insertMany(resourceDocuments, { session });
    }

    if (moduleResourceDocuments.length > 0) {
      await RoadmapModuleResource.insertMany(moduleResourceDocuments, { session });
    }

    if (projectDocuments.length > 0) {
      await Project.insertMany(projectDocuments, { session });
    }

    if (projectResourceDocuments.length > 0) {
      await ProjectResource.insertMany(projectResourceDocuments, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Roadmap created successfully",
      roadmapId: roadmapDocument._id
    });
  } catch (error) {
    await session.abortTransaction();

    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create roadmap"
    });
  } finally {
    session.endSession();
  }
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
