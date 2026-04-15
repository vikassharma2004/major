import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { RoadmapTask } from "../models/roadmap/RoadmapTask.modal.js";
import { Resource } from "../models/roadmap/ResourceModel.js";
import { Project } from "../models/roadmap/ProjectModel.js";
import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import logger from "../config/logger.js";
import { Community } from "../models/Community/Community.model.js";
import { CommunityMember } from "../models/Community/CommunityMember.model.js";
export const createRoadmap = async (data, mentorId) => {
  const {
    title,
    shortDescription,
    detailedDescription,
    learningOutcomes,
    coverImage,
    visualOverview,
    level,
    domain,
    isPaid = false,
    price = 0
  } = data;

  // 🔒 Enforce pricing rule
  const finalPrice = isPaid ? Number(price) : 0;

  const roadmap = await Roadmap.create({
    title,
    shortDescription,
    detailedDescription,
    learningOutcomes,
    coverImage,
    visualOverview,
    level,
    domain,
    isPaid,
    price: finalPrice,
    createdBy: mentorId
  });

  return roadmap;
};

export const getMyRoadmaps = async (userId) => {
  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const roadmaps = await Roadmap.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .select(
      "title shortDescription level isPaid price isPublished createdAt updatedAt"
    );

  return roadmaps;
};
export const updateRoadmap = async (roadmapId, mentorId, data) => {
  const roadmap = await Roadmap.findOneAndUpdate(
    { _id: roadmapId, createdBy: mentorId },
    data,
    { new: true, runValidators: true }
  );

  if (!roadmap) {
    throw new AppError("Roadmap not found or unauthorized", 404);
  }

  return roadmap;
};

export const getRoadmapById = async (roadmapId, userId = null) => {
  const roadmap = await Roadmap.findById(roadmapId);

  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  // unpublished roadmap visible only to creator
  if (!roadmap.isPublished && roadmap.createdBy.toString() !== userId) {
    throw new AppError("Roadmap not accessible", 403);
  }

  return roadmap;
};

export const getAllPublishedRoadmaps = async ({
  page = 1,
  limit = 20,
  level,
  isPaid,
  title,
  domain
}) => {
  const filter = {
    isPublished: true
  };

  // level filter
  if (level) {
    filter.level = level;
  }

  // paid / free filter
  if (typeof isPaid !== "undefined") {
    filter.isPaid = isPaid === "true";
  }

  // title search (case-insensitive)
  if (title) {
    filter.title = { $regex: title, $options: "i" };
  }
  if(domain){
    filter.domain = domain;
  }

  const skip = (page - 1) * limit;

  const [roadmaps, total] = await Promise.all([
    Roadmap.find(filter)
      .select(
        "title shortDescription coverImage level isPaid price createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),

    Roadmap.countDocuments(filter)
  ]);

  return {
    data: roadmaps,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      hasNext: skip + roadmaps.length < total,
      hasPrev: page > 1
    }
  };
};




export const togglePublishRoadmap = async (roadmapId, mentorId) => {
  const roadmap = await Roadmap.findOne({
    _id: roadmapId,
    createdBy: mentorId
  });

  if (!roadmap) {
    throw new AppError("Roadmap not found or unauthorized", 404);
  }
 

  /* ========================= UNPUBLISH DIRECTLY ========================= */
  if (roadmap.isPublished) {
    roadmap.isPublished = false;
    await roadmap.save();

    return {
      status: "unpublished",
      message: "Roadmap unpublished successfully"
    };
  }

  /* ========================= VALIDATION BEFORE PUBLISH ========================= */
  const errors = [];

  // 1️⃣ Modules
  const modules = await RoadmapModule.find({ roadmapId: roadmap._id }).select("_id title");

  if (modules.length < 5) {
    errors.push("At least 5 modules are required");
  }

  // 2️⃣ Tasks & Resources per module
  // for (const module of modules) {
  //   const tasks = await RoadmapTask.find({ moduleId: module._id }).select("_id title");

  //   if (tasks.length < 2) {
  //     errors.push(`Module "${module.title}" must have at least 2 tasks`);
  //     continue;
  //   }

  //   for (const task of tasks) {
  //     const resourceCount = await Resource.countDocuments({ taskId: task._id });

  //     if (resourceCount === 0) {
  //       errors.push(`Task "${task.title}" has no resources`);
  //     }
  //   }
  // }

  // 3️⃣ Projects
  // const projectCount = await Project.countDocuments({ roadmapId: roadmap._id });

  // if (projectCount < 3) {
  //   errors.push("At least 3 projects are required for this roadmap");
  // }

  /* ========================= FINAL DECISION ========================= */
  if (errors.length > 0) {
    throw new AppError(
      "Roadmap publish failed due to incomplete structure",
      400,
      { reasons: errors }
    );
  }

  roadmap.isPublished = true;
  await roadmap.save();

/* ========================= CREATE COMMUNITY IF NOT EXISTS ========================= */
let community = await Community.findOne({ roadmapId: roadmap._id });

if (!community) {
  community = await Community.create({
    roadmapId: roadmap._id,
    name: roadmap.title,
    type: roadmap.isPaid ? "private" : "public",
    createdBy: roadmap.createdBy,
    isActive: true
  });
} else {
  // Community exists → just ensure it's active
  if (!community.isActive) {
    community.isActive = true;
    await community.save();
  }
}
const existingMentor = await CommunityMember.findOne({
  communityId: community._id,
  userId: roadmap.createdBy
});

if (!existingMentor) {
  await CommunityMember.create({
    communityId: community._id,
    userId: roadmap.createdBy,
    role: "mentor"
  });
  logger.info("member added")
}

  return {
    status: `${roadmap.isPublished ? "published" : "unpublished"}`,
    message:`Roadmap ${roadmap.isPublished ? "published" : "unpublished"} successfully`
  };
};


export const deleteRoadmap = async (roadmapId, mentorId) => {
  const roadmap = await Roadmap.findOneAndDelete({
    _id: roadmapId,
    createdBy: mentorId
  });

  if (!roadmap) {
    throw new AppError("Roadmap not found or unauthorized", 404);
  }

  return;
};
