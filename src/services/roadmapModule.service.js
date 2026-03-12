import { RoadmapModule } from "../models/roadmap/RoadmapModule.model.js";
import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE MODULE ========================= */
export const createModule = async (data, mentorId, roadmapId) => {
  const roadmap = await Roadmap.findById(roadmapId);
  console.log(roadmap);

  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  if (roadmap.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to add module to this roadmap", 403);
  }

  // prevent duplicate order in same roadmap
  const existingOrder = await RoadmapModule.findOne({
    roadmapId,
    order: data.order
  });

  if (existingOrder) {
    throw new AppError("Module order already exists in this roadmap", 409);
  }

  const roadmapModule = await RoadmapModule.create({
    roadmapId,
    order: data.order,
    title: data.title,
    description: data.description
  })
  return roadmapModule;
};

/* ========================= UPDATE MODULE ========================= */
export const updateModule = async (moduleId, mentorId, updateData) => {
  const module = await RoadmapModule.findById(moduleId).populate("roadmapId");

  if (!module) {
    throw new AppError("Module not found", 404);
  }

  if (module.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to update this module", 403);
  }

  // handle order conflict
  if (updateData.order && updateData.order !== module.order) {
    const conflict = await RoadmapModule.findOne({
      roadmapId: module.roadmapId._id,
      order: updateData.order
    });

    if (conflict) {
      throw new AppError("Module order conflict in roadmap", 409);
    }
  }

  Object.assign(module, updateData);
  await module.save();

  return module;
};

/* ========================= GET MODULES BY ROADMAP ========================= */
export const getModulesByRoadmap = async (roadmapId) => {
  return RoadmapModule.find({ roadmapId })
    .sort({ order: 1 })
    .select("title order");
};

/* ========================= DELETE MODULE ========================= */
export const deleteModule = async (moduleId, mentorId) => {
  const module = await RoadmapModule.findById(moduleId).populate("roadmapId");

  if (!module) {
    throw new AppError("Module not found", 404);
  }

  if (module.roadmapId.createdBy.toString() !== mentorId) {
    throw new AppError("Not authorized to delete this module", 403);
  }

  // 🔒 important rule: module deletion should be blocked if tasks exist
  // (we enforce quality)
  // You can relax this later if needed
  const hasTasks = await mongoose.model("RoadmapTask").exists({
    moduleId
  });

  if (hasTasks) {
    throw new AppError(
      "Cannot delete module with existing tasks",
      400
    );
  }

  await module.deleteOne();
};
