import { Resource } from "../models/roadmap/ResourceModel.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE RESOURCE ========================= */
export const createResource = async (data, mentorId, taskId) => {
  const task = await RoadmapTask.findById(taskId).populate({
    path: "moduleId",
    populate: { path: "roadmapId" }
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  // mentor ownership check
  if (task.moduleId.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to add resource to this task", 403);
  }

  const resource=await Resource.create({

    taskId,
    type: data.type,
    link: data.link,
    title: data.title,
    url: data.url,
    description: data.description,

  })
  return resource
};

/* ========================= UPDATE RESOURCE ========================= */
export const updateResource = async (resourceId, mentorId, updateData) => {
  const resource = await Resource.findById(resourceId).populate({
    path: "taskId",
    populate: {
      path: "moduleId",
      populate: { path: "roadmapId" }
    }
  });

  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  if (
    resource.taskId.moduleId.roadmapId.createdBy.toString() !== mentorId
  ) {
    throw new AppError("Not authorized to update this resource", 403);
  }

  Object.assign(resource, updateData);
  await resource.save();

  return resource;
};

/* ========================= GET RESOURCES BY TASK ========================= */
export const getResourcesByTask = async (taskId) => {
  return Resource.find({ taskId }).sort("createdAt");
};

/* ========================= DELETE RESOURCE ========================= */
export const deleteResource = async (resourceId, mentorId) => {
  const resource = await Resource.findById(resourceId).populate({
    path: "taskId",
    populate: {
      path: "moduleId",
      populate: { path: "roadmapId" }
    }
  });

  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  if (
    resource.taskId.moduleId.roadmapId.createdBy.toString() !== mentorId
  ) {
    throw new AppError("Not authorized to delete this resource", 403);
  }

  await resource.deleteOne();
};
