import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";

export const getMyTasks = async (
  userId,
  { page = 1, limit = 10 } = {}
) => {
  const enrollments = await Enrollment.find({
    userId,
    status: "active"
  })
    .select("roadmapId")
    .lean();

  const roadmapIds = enrollments.map((enrollment) => enrollment.roadmapId);

  if (roadmapIds.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  const modules = await RoadmapModule.find({
    roadmapId: { $in: roadmapIds }
  })
    .select("_id")
    .lean();

  const moduleIds = modules.map((module) => module._id);

  if (moduleIds.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };
  }

  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    RoadmapTask.find({ moduleId: { $in: moduleIds } })
      .sort({ moduleId: 1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "title description taskType expectedThinking successCriteria allowFullSolution order moduleId createdAt updatedAt"
      )
      .populate({
        path: "moduleId",
        select: "title order roadmapId",
        populate: {
          path: "roadmapId",
          select: "title"
        }
      })
      .lean(),
    RoadmapTask.countDocuments({ moduleId: { $in: moduleIds } })
  ]);

  return {
    data: tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      expectedThinking: task.expectedThinking,
      successCriteria: task.successCriteria,
      allowFullSolution: task.allowFullSolution,
      order: task.order,
      roadmap: task.moduleId?.roadmapId
        ? {
            id: task.moduleId.roadmapId._id,
            title: task.moduleId.roadmapId.title
          }
        : null,
      module: task.moduleId
        ? {
            id: task.moduleId._id,
            title: task.moduleId.title,
            order: task.moduleId.order
          }
        : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + tasks.length < total,
      hasPrev: page > 1
    }
  };
};
