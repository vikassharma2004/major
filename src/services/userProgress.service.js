import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import {
  USER_PROGRESS_STATUSES,
  UserProgress
} from "../models/Progress/UserProgress.js";
import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";

const NOT_STARTED = "not-started";
const IN_PROGRESS = "in-progress";
const COMPLETED = "completed";

const resolveCompletionDate = (status, fallbackDate = null) => {
  if (status !== COMPLETED) {
    return null;
  }

  return fallbackDate ?? new Date();
};

const aggregateStatuses = (statuses) => {
  if (!statuses.length) {
    return NOT_STARTED;
  }

  if (statuses.every((status) => status === COMPLETED)) {
    return COMPLETED;
  }

  if (statuses.some((status) => status === IN_PROGRESS || status === COMPLETED)) {
    return IN_PROGRESS;
  }

  return NOT_STARTED;
};

const latestCompletedAt = (dates) => {
  const validDates = dates.filter(Boolean).map((value) => new Date(value));

  if (!validDates.length) {
    return null;
  }

  return new Date(Math.max(...validDates.map((value) => value.getTime())));
};

export const assertRoadmapAccess = async (roadmapId, userId, role) => {
  const roadmap = await Roadmap.findById(roadmapId)
    .select("_id title createdBy isPublished")
    .lean();

  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  const isOwner = roadmap.createdBy?.toString() === userId;
  const isAdmin = role === "admin";

  if (isOwner || isAdmin) {
    return roadmap;
  }

  const hasActiveEnrollment = await Enrollment.exists({
    userId,
    roadmapId,
    status: "active"
  });

  if (!hasActiveEnrollment) {
    throw new AppError("Active enrollment not found for roadmap", 403);
  }

  return roadmap;
};

const resolveScopedProgressTarget = async ({ roadmapId, moduleId, taskId }) => {
  if (taskId) {
    const task = await RoadmapTask.findById(taskId)
      .select("_id moduleId title")
      .populate({
        path: "moduleId",
        select: "_id roadmapId title"
      })
      .lean();

    if (!task) {
      throw new AppError("Roadmap task not found", 404);
    }

    const resolvedModuleId = task.moduleId?._id?.toString();
    const resolvedRoadmapId = task.moduleId?.roadmapId?.toString();

    if (!resolvedModuleId || !resolvedRoadmapId) {
      throw new AppError("Task hierarchy is invalid", 400);
    }

    if (resolvedRoadmapId !== roadmapId) {
      throw new AppError("taskId does not belong to the provided roadmapId", 400);
    }

    if (moduleId && resolvedModuleId !== moduleId) {
      throw new AppError("taskId does not belong to the provided moduleId", 400);
    }

    return {
      roadmapId,
      moduleId: resolvedModuleId,
      taskId: task._id.toString()
    };
  }

  if (moduleId) {
    const module = await RoadmapModule.findById(moduleId)
      .select("_id roadmapId title")
      .lean();

    if (!module) {
      throw new AppError("Roadmap module not found", 404);
    }

    if (module.roadmapId.toString() !== roadmapId) {
      throw new AppError("moduleId does not belong to the provided roadmapId", 400);
    }

    return {
      roadmapId,
      moduleId: module._id.toString(),
      taskId: null
    };
  }

  return {
    roadmapId,
    moduleId: null,
    taskId: null
  };
};

const buildScopedProgressQuery = ({ userId, roadmapId, moduleId = null, taskId = null }) => ({
  userId,
  roadmapId,
  moduleId,
  taskId
});

const upsertScopedProgress = async ({
  userId,
  roadmapId,
  moduleId = null,
  taskId = null,
  status
}) => {
  const query = buildScopedProgressQuery({
    userId,
    roadmapId,
    moduleId,
    taskId
  });

  return UserProgress.findOneAndUpdate(
    query,
    {
      $set: {
        status,
        completedAt: resolveCompletionDate(status),
        moduleId,
        taskId
      },
      $setOnInsert: {
        userId,
        roadmapId
      }
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true
    }
  );
};

const getScopedProgress = async ({ userId, roadmapId, moduleId = null, taskId = null }) =>
  UserProgress.findOne(
    buildScopedProgressQuery({
      userId,
      roadmapId,
      moduleId,
      taskId
    })
  );

const getRoadmapProgressContext = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findById(roadmapId)
    .select("_id title")
    .lean();

  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  const modules = await RoadmapModule.find({ roadmapId })
    .select("_id title description order")
    .sort({ order: 1 })
    .lean();

  const moduleIds = modules.map((module) => module._id);
  const tasks = moduleIds.length
    ? await RoadmapTask.find({ moduleId: { $in: moduleIds } })
        .select("_id moduleId title taskType order")
        .sort({ moduleId: 1, order: 1 })
        .lean()
    : [];

  const progressRecords = await UserProgress.find({ userId, roadmapId })
    .select("_id roadmapId moduleId taskId status completedAt createdAt updatedAt")
    .lean();

  return { roadmap, modules, tasks, progressRecords };
};

const buildProgressLookups = (progressRecords) => {
  const roadmapProgressRecord =
    progressRecords.find((record) => !record.moduleId && !record.taskId) ?? null;
  const moduleProgressMap = new Map();
  const taskProgressMap = new Map();

  progressRecords.forEach((record) => {
    if (record.taskId) {
      taskProgressMap.set(record.taskId.toString(), record);
      return;
    }

    if (record.moduleId) {
      moduleProgressMap.set(record.moduleId.toString(), record);
    }
  });

  return {
    roadmapProgressRecord,
    moduleProgressMap,
    taskProgressMap
  };
};

const resolveTaskStatus = (taskId, taskProgressMap) =>
  taskProgressMap.get(taskId.toString())?.status ?? NOT_STARTED;

const resolveModuleState = ({ module, moduleTasks, moduleProgressMap, taskProgressMap }) => {
  const moduleProgressRecord = moduleProgressMap.get(module._id.toString()) ?? null;

  if (!moduleTasks.length) {
    return {
      status: moduleProgressRecord?.status ?? NOT_STARTED,
      progressRecord: moduleProgressRecord,
      completedAt: moduleProgressRecord?.completedAt ?? null
    };
  }

  const taskStatuses = moduleTasks.map((task) =>
    resolveTaskStatus(task._id, taskProgressMap)
  );
  const derivedTaskStatus = aggregateStatuses(taskStatuses);

  if (derivedTaskStatus !== NOT_STARTED) {
    return {
      status: derivedTaskStatus,
      progressRecord: moduleProgressRecord,
      completedAt:
        derivedTaskStatus === COMPLETED
          ? moduleProgressRecord?.completedAt ??
            latestCompletedAt(
              moduleTasks.map((task) => taskProgressMap.get(task._id.toString())?.completedAt)
            )
          : null
    };
  }

  return {
    status: moduleProgressRecord?.status ?? NOT_STARTED,
    progressRecord: moduleProgressRecord,
    completedAt: moduleProgressRecord?.completedAt ?? null
  };
};

const syncModuleProgress = async (userId, roadmapId, moduleId) => {
  const tasks = await RoadmapTask.find({ moduleId }).select("_id").lean();

  if (!tasks.length) {
    return upsertScopedProgress({
      userId,
      roadmapId,
      moduleId,
      status: NOT_STARTED
    });
  }

  const taskIds = tasks.map((task) => task._id);
  const taskProgressRecords = await UserProgress.find({
    userId,
    roadmapId,
    taskId: { $in: taskIds }
  })
    .select("taskId status completedAt")
    .lean();

  const taskProgressMap = new Map(
    taskProgressRecords.map((record) => [record.taskId.toString(), record])
  );
  const status = aggregateStatuses(
    taskIds.map((taskId) => taskProgressMap.get(taskId.toString())?.status ?? NOT_STARTED)
  );

  return upsertScopedProgress({
    userId,
    roadmapId,
    moduleId,
    status
  });
};

const syncRoadmapProgress = async (userId, roadmapId) => {
  const modules = await RoadmapModule.find({ roadmapId }).select("_id").lean();

  if (!modules.length) {
    return upsertScopedProgress({
      userId,
      roadmapId,
      status: NOT_STARTED
    });
  }

  const moduleIds = modules.map((module) => module._id);
  const moduleProgressRecords = await UserProgress.find({
    userId,
    roadmapId,
    moduleId: { $in: moduleIds },
    taskId: null
  })
    .select("moduleId status")
    .lean();

  const moduleProgressMap = new Map(
    moduleProgressRecords.map((record) => [record.moduleId.toString(), record])
  );

  const status = aggregateStatuses(
    moduleIds.map(
      (moduleId) => moduleProgressMap.get(moduleId.toString())?.status ?? NOT_STARTED
    )
  );

  return upsertScopedProgress({
    userId,
    roadmapId,
    status
  });
};

const validateParentCompletion = async (userId, roadmapId, moduleId = null) => {
  if (moduleId) {
    const tasks = await RoadmapTask.find({ moduleId }).select("_id").lean();

    if (!tasks.length) {
      throw new AppError("Cannot mark module progress as completed without tasks", 400);
    }

    const taskProgressRecords = await UserProgress.find({
      userId,
      roadmapId,
      taskId: { $in: tasks.map((task) => task._id) },
      status: COMPLETED
    })
      .select("taskId")
      .lean();

    if (taskProgressRecords.length !== tasks.length) {
      throw new AppError("All module tasks must be completed first", 400);
    }

    return;
  }

  const modules = await RoadmapModule.find({ roadmapId }).select("_id").lean();

  if (!modules.length) {
    throw new AppError("Cannot mark roadmap progress as completed without modules", 400);
  }

  const moduleProgressRecords = await UserProgress.find({
    userId,
    roadmapId,
    moduleId: { $in: modules.map((module) => module._id) },
    taskId: null,
    status: COMPLETED
  })
    .select("moduleId")
    .lean();

  if (moduleProgressRecords.length !== modules.length) {
    throw new AppError("All roadmap modules must be completed first", 400);
  }
};

const populateProgressQuery = (query) =>
  query
    .populate({ path: "roadmapId", select: "title level domain" })
    .populate({ path: "moduleId", select: "title order roadmapId" })
    .populate({ path: "taskId", select: "title order taskType moduleId" });

export const createProgress = async (user, payload) => {
  await assertRoadmapAccess(payload.roadmapId, user.id, user.role);

  const scope = await resolveScopedProgressTarget(payload);

  if (payload.status === COMPLETED && !scope.taskId) {
    await validateParentCompletion(user.id, scope.roadmapId, scope.moduleId);
  }

  const progress = await upsertScopedProgress({
    userId: user.id,
    roadmapId: scope.roadmapId,
    moduleId: scope.moduleId,
    taskId: scope.taskId,
    status: payload.status
  });

  if (scope.taskId) {
    await syncModuleProgress(user.id, scope.roadmapId, scope.moduleId);
    await syncRoadmapProgress(user.id, scope.roadmapId);
  } else if (scope.moduleId) {
    await syncRoadmapProgress(user.id, scope.roadmapId);
  }

  return populateProgressQuery(UserProgress.findById(progress._id)).lean();
};

export const updateProgress = async (progressId, user, payload) => {
  const progress = await UserProgress.findOne({
    _id: progressId,
    userId: user.id
  });

  if (!progress) {
    throw new AppError("Progress record not found", 404);
  }

  await assertRoadmapAccess(progress.roadmapId, user.id, user.role);

  if (payload.status === COMPLETED && !progress.taskId) {
    await validateParentCompletion(user.id, progress.roadmapId, progress.moduleId);
  }

  progress.status = payload.status;
  progress.completedAt = resolveCompletionDate(payload.status, progress.completedAt);
  await progress.save();

  if (progress.taskId) {
    await syncModuleProgress(user.id, progress.roadmapId, progress.moduleId);
    await syncRoadmapProgress(user.id, progress.roadmapId);
  } else if (progress.moduleId) {
    await syncRoadmapProgress(user.id, progress.roadmapId);
  }

  return populateProgressQuery(UserProgress.findById(progress._id)).lean();
};

export const getProgressRecordById = async (progressId, user) => {
  const progress = await populateProgressQuery(
    UserProgress.findOne({
      _id: progressId,
      userId: user.id
    })
  ).lean();

  if (!progress) {
    throw new AppError("Progress record not found", 404);
  }

  await assertRoadmapAccess(progress.roadmapId._id, user.id, user.role);

  return progress;
};

export const listProgressRecords = async (user, filters = {}) => {
  if (filters.roadmapId) {
    await assertRoadmapAccess(filters.roadmapId, user.id, user.role);
  }

  const query = { userId: user.id };

  if (filters.roadmapId) {
    query.roadmapId = filters.roadmapId;
  }

  if (filters.moduleId) {
    query.moduleId = filters.moduleId;
  }

  if (filters.taskId) {
    query.taskId = filters.taskId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.scope === "roadmap") {
    query.moduleId = null;
    query.taskId = null;
  }

  if (filters.scope === "module") {
    if (!filters.moduleId) {
      query.moduleId = { $ne: null };
    }
    query.taskId = null;
  }

  if (filters.scope === "task") {
    if (!filters.taskId) {
      query.taskId = { $ne: null };
    }
  }

  const skip = (filters.page - 1) * filters.limit;
  const sort = {
    [filters.sortBy]: filters.sortOrder === "asc" ? 1 : -1,
    _id: 1
  };

  const [records, total] = await Promise.all([
    populateProgressQuery(
      UserProgress.find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit)
    ).lean(),
    UserProgress.countDocuments(query)
  ]);

  return {
    data: records,
    pagination: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
      hasNext: skip + records.length < total,
      hasPrev: filters.page > 1
    }
  };
};

export const getRoadmapProgress = async (user, roadmapId) => {
  await assertRoadmapAccess(roadmapId, user.id, user.role);

  const { roadmap, modules, tasks, progressRecords } = await getRoadmapProgressContext(
    user.id,
    roadmapId
  );
  const { roadmapProgressRecord, moduleProgressMap, taskProgressMap } =
    buildProgressLookups(progressRecords);

  const tasksByModuleId = new Map();

  tasks.forEach((task) => {
    const moduleId = task.moduleId.toString();

    if (!tasksByModuleId.has(moduleId)) {
      tasksByModuleId.set(moduleId, []);
    }

    tasksByModuleId.get(moduleId).push(task);
  });

  const moduleItems = modules.map((module) => {
    const moduleTasks = tasksByModuleId.get(module._id.toString()) ?? [];
    const moduleState = resolveModuleState({
      module,
      moduleTasks,
      moduleProgressMap,
      taskProgressMap
    });
    const taskItems = moduleTasks.map((task) => {
      const taskProgressRecord = taskProgressMap.get(task._id.toString()) ?? null;
      const taskStatus = taskProgressRecord?.status ?? NOT_STARTED;

      return {
        progressId: taskProgressRecord?._id ?? null,
        taskId: task._id,
        title: task.title,
        taskType: task.taskType,
        order: task.order,
        status: taskStatus,
        completedAt: taskProgressRecord?.completedAt ?? null,
        updatedAt: taskProgressRecord?.updatedAt ?? null
      };
    });

    const completedTasks = taskItems.filter((task) => task.status === COMPLETED).length;

    return {
      progressId: moduleState.progressRecord?._id ?? null,
      moduleId: module._id,
      title: module.title,
      description: module.description,
      order: module.order,
      status: moduleState.status,
      completedAt: moduleState.completedAt,
      taskCounts: {
        total: taskItems.length,
        completed: completedTasks
      },
      tasks: taskItems
    };
  });

  const roadmapDerivedStatus = aggregateStatuses(
    moduleItems.map((module) => module.status)
  );
  const roadmapStatus =
    roadmapDerivedStatus !== NOT_STARTED
      ? roadmapDerivedStatus
      : roadmapProgressRecord?.status ?? NOT_STARTED;

  const totalTasks = tasks.length;
  const completedTasks = moduleItems.reduce(
    (total, module) => total + module.taskCounts.completed,
    0
  );
  const completedModules = moduleItems.filter(
    (module) => module.status === COMPLETED
  ).length;

  return {
    roadmap: {
      progressId: roadmapProgressRecord?._id ?? null,
      roadmapId: roadmap._id,
      title: roadmap.title,
      status: roadmapStatus,
      completedAt:
        roadmapStatus === COMPLETED
          ? roadmapProgressRecord?.completedAt ??
            latestCompletedAt(moduleItems.map((module) => module.completedAt))
          : null,
      moduleCounts: {
        total: modules.length,
        completed: completedModules
      },
      taskCounts: {
        total: totalTasks,
        completed: completedTasks
      },
      completionPercentage:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    },
    modules: moduleItems
  };
};

export const startTask = async (user, taskId) => {
  const task = await RoadmapTask.findById(taskId)
    .select("_id moduleId")
    .populate({
      path: "moduleId",
      select: "_id roadmapId"
    })
    .lean();

  if (!task || !task.moduleId?.roadmapId) {
    throw new AppError("Roadmap task not found", 404);
  }

  await assertRoadmapAccess(task.moduleId.roadmapId, user.id, user.role);

  const currentProgress = await getScopedProgress({
    userId: user.id,
    roadmapId: task.moduleId.roadmapId.toString(),
    moduleId: task.moduleId._id.toString(),
    taskId: task._id.toString()
  });

  if (currentProgress?.status === COMPLETED) {
    throw new AppError("Task already completed", 400);
  }

  const progress = await upsertScopedProgress({
    userId: user.id,
    roadmapId: task.moduleId.roadmapId.toString(),
    moduleId: task.moduleId._id.toString(),
    taskId: task._id.toString(),
    status: IN_PROGRESS
  });

  const moduleProgress = await getScopedProgress({
    userId: user.id,
    roadmapId: task.moduleId.roadmapId.toString(),
    moduleId: task.moduleId._id.toString()
  });

  if (!moduleProgress || moduleProgress.status !== COMPLETED) {
    await upsertScopedProgress({
      userId: user.id,
      roadmapId: task.moduleId.roadmapId.toString(),
      moduleId: task.moduleId._id.toString(),
      status: IN_PROGRESS
    });
  }

  const roadmapProgress = await getScopedProgress({
    userId: user.id,
    roadmapId: task.moduleId.roadmapId.toString()
  });

  if (!roadmapProgress || roadmapProgress.status !== COMPLETED) {
    await upsertScopedProgress({
      userId: user.id,
      roadmapId: task.moduleId.roadmapId.toString(),
      status: IN_PROGRESS
    });
  }

  return populateProgressQuery(UserProgress.findById(progress._id)).lean();
};

export const completeTask = async (user, taskId) => {
  const task = await RoadmapTask.findById(taskId)
    .select("_id moduleId")
    .populate({
      path: "moduleId",
      select: "_id roadmapId"
    })
    .lean();

  if (!task || !task.moduleId?.roadmapId) {
    throw new AppError("Roadmap task not found", 404);
  }

  await assertRoadmapAccess(task.moduleId.roadmapId, user.id, user.role);

  const currentProgress = await getScopedProgress({
    userId: user.id,
    roadmapId: task.moduleId.roadmapId.toString(),
    moduleId: task.moduleId._id.toString(),
    taskId: task._id.toString()
  });

  if (!currentProgress || currentProgress.status !== IN_PROGRESS) {
    throw new AppError("Task not in progress", 400);
  }

  const progress = await upsertScopedProgress({
    userId: user.id,
    roadmapId: task.moduleId.roadmapId.toString(),
    moduleId: task.moduleId._id.toString(),
    taskId: task._id.toString(),
    status: COMPLETED
  });

  await syncModuleProgress(
    user.id,
    task.moduleId.roadmapId.toString(),
    task.moduleId._id.toString()
  );
  await syncRoadmapProgress(user.id, task.moduleId.roadmapId.toString());

  return populateProgressQuery(UserProgress.findById(progress._id)).lean();
};

export const getUserProgressByRoadmap = async (user, roadmapId) =>
  getRoadmapProgress(user, roadmapId);

export { USER_PROGRESS_STATUSES };
