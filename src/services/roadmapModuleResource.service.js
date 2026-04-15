import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import {
  RoadmapModuleResource
} from "../models/roadmap/RoadmapModuleResource.model.js";
import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";

const getModuleContext = async (moduleId) => {
  const module = await RoadmapModule.findById(moduleId)
    .select("_id title order roadmapId")
    .populate({
      path: "roadmapId",
      select: "_id title createdBy isPublished"
    })
    .lean();

  if (!module) {
    throw new AppError("Roadmap module not found", 404);
  }

  if (!module.roadmapId) {
    throw new AppError("Parent roadmap not found for module", 404);
  }

  return module;
};

const assertCanReadModule = async (moduleId, userId, role) => {
  const module = await getModuleContext(moduleId);
  const isOwner = module.roadmapId.createdBy?.toString() === userId;
  const isAdmin = role === "admin";

  if (module.roadmapId.isPublished || isOwner || isAdmin) {
    return module;
  }

  const hasActiveEnrollment = await Enrollment.exists({
    userId,
    roadmapId: module.roadmapId._id,
    status: "active"
  });

  if (!hasActiveEnrollment) {
    throw new AppError("Roadmap module is not accessible", 403);
  }

  return module;
};

const assertCanManageModule = async (moduleId, mentorId) => {
  const module = await getModuleContext(moduleId);

  if (module.roadmapId.createdBy?.toString() !== mentorId) {
    throw new AppError("Not authorized to manage resources for this module", 403);
  }

  return module;
};

const getResourceContext = async (resourceId) => {
  const resource = await RoadmapModuleResource.findById(resourceId)
    .populate({
      path: "moduleId",
      select: "_id title order roadmapId",
      populate: {
        path: "roadmapId",
        select: "_id title createdBy isPublished"
      }
    });

  if (!resource) {
    throw new AppError("Module resource not found", 404);
  }

  return resource;
};

const ensureResourceOrderAvailable = async (moduleId, order, excludeId = null) => {
  const filter = {
    moduleId,
    order
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existingResource = await RoadmapModuleResource.findOne(filter)
    .select("_id")
    .lean();

  if (existingResource) {
    throw new AppError("Resource order already exists in this module", 409);
  }
};

export const createModuleResource = async (data, mentorId, moduleId) => {
  await assertCanManageModule(moduleId, mentorId);
  await ensureResourceOrderAvailable(moduleId, data.order);

  const resource = await RoadmapModuleResource.create({
    moduleId,
    ...data
  });

  return resource;
};

export const getModuleResourceById = async (resourceId, userId, role) => {
  const resource = await getResourceContext(resourceId);
  const isOwner = resource.moduleId.roadmapId.createdBy?.toString() === userId;
  const isAdmin = role === "admin";

  if (!resource.moduleId.roadmapId.isPublished && !isOwner && !isAdmin) {
    const hasActiveEnrollment = await Enrollment.exists({
      userId,
      roadmapId: resource.moduleId.roadmapId._id,
      status: "active"
    });

    if (!hasActiveEnrollment) {
      throw new AppError("Module resource is not accessible", 403);
    }
  }

  return resource;
};

export const listModuleResources = async (
  moduleId,
  user,
  {
    type,
    difficulty,
    learningStage,
    page = 1,
    limit = 20,
    sortBy = "order",
    sortOrder = "asc"
  } = {}
) => {
  const module = await assertCanReadModule(moduleId, user.id, user.role);
  const filter = { moduleId };

  if (type) {
    filter.type = type;
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  if (learningStage) {
    filter.learningStage = learningStage;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1, _id: 1 };

  const [resources, total] = await Promise.all([
    RoadmapModuleResource.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    RoadmapModuleResource.countDocuments(filter)
  ]);

  return {
    module: {
      id: module._id,
      title: module.title,
      order: module.order,
      roadmapId: module.roadmapId._id,
      roadmapTitle: module.roadmapId.title
    },
    data: resources,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + resources.length < total,
      hasPrev: page > 1
    }
  };
};

export const updateModuleResource = async (resourceId, mentorId, updateData) => {
  const resource = await getResourceContext(resourceId);

  if (resource.moduleId.roadmapId.createdBy?.toString() !== mentorId) {
    throw new AppError("Not authorized to update this module resource", 403);
  }

  if (
    typeof updateData.order !== "undefined" &&
    updateData.order !== resource.order
  ) {
    await ensureResourceOrderAvailable(resource.moduleId._id, updateData.order, resourceId);
  }

  Object.assign(resource, updateData);
  await resource.save();

  return resource;
};

export const deleteModuleResource = async (resourceId, mentorId) => {
  const resource = await getResourceContext(resourceId);

  if (resource.moduleId.roadmapId.createdBy?.toString() !== mentorId) {
    throw new AppError("Not authorized to delete this module resource", 403);
  }

  await resource.deleteOne();
};
