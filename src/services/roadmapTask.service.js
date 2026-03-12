
import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
/* ========================= CREATE TASK ========================= */
export const createTask = async (data, mentorId, moduleId) => {
  // Ensure module exists and belongs to mentor
  const module = await RoadmapModule.findById(moduleId).populate("roadmapId");

  if (!module) {
    throw new AppError("Roadmap module not found", 404);
  }

  if (module.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to add task to this module", 403);
  }

  // Prevent duplicate order inside same module
  const existingOrder = await RoadmapTask.findOne({
    moduleId,
    order: data.order
  });

  if (existingOrder) {
    throw new AppError("Task order already exists in this module", 409);
  }
const roadmapTask = await RoadmapTask.create({
    moduleId,
    order: data.order,
    title: data.title,
    description: data.description,
    taskType: data.taskType,
    successCriteria: data.successCriteria,
    expectedThinking: data.expectedThinking,
    allowFullSolution: data.allowFullSolution
  });
  return roadmapTask;
};

/* ========================= UPDATE TASK ========================= */
export const updateTask = async (taskId, mentorId, updateData) => {
  const task = await RoadmapTask.findById(taskId).populate({
    path: "moduleId",
    populate: { path: "roadmapId" }
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.moduleId.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to update this task", 403);
  }

  // Handle order conflict if order is updated
  if (updateData.order && updateData.order !== task.order) {
    const conflict = await RoadmapTask.findOne({
      moduleId: task.moduleId._id,
      order: updateData.order
    });

    if (conflict) {
      throw new AppError("Task order conflict in module", 409);
    }
  }

  Object.assign(task, updateData);
  await task.save();

  return task;
};

/* ========================= GET TASKS BY MODULE ========================= */
export const getTasksByModule = async (moduleId) => {
  return RoadmapTask.find({ moduleId })
    .sort({ order: 1 })
    .select("title taskType successCriteria expectedThinking description order")
    .lean();
};


/* ========================= DELETE TASK ========================= */
export const deleteTask = async (taskId, mentorId) => {
  const task = await RoadmapTask.findById(taskId).populate({
    path: "moduleId",
    populate: { path: "roadmapId" }
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  if (task.moduleId.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to delete this task", 403);
  }

  await task.deleteOne();
};
