import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { AppError } from "./ErrorHanlder.js";

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to access this resource",
        403
      );
    }

    next();
  };
};



export const requireRoadmapAccess = async (req, res, next) => {
  const { roadmapId } = req.params;
  const userId = req.user.id;

  // 1️⃣ Check ownership (mentor)
  const roadmap = await Roadmap.findById(roadmapId).select("createdBy");
  if (!roadmap) {
    throw new AppError("Roadmap not found", 404);
  }

  if (roadmap.createdBy.toString() === userId) {
    req.accessRole = "mentor";
    return next();
  }

  // 2️⃣ Check enrollment (learner)
  const enrollment = await Enrollment.findOne({
    roadmapId,
    userId,
    status: "active"
  });

  if (!enrollment) {
    throw new AppError(
      "You are not authorized to access this roadmap",
      403
    );
  }

  req.accessRole = "learner";
  next();
};
