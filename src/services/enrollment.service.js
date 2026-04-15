import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { CommunityMember } from "../models/Community/CommunityMember.model.js";
import { Community } from "../models/Community/Community.model.js";
import logger from "../config/logger.js";

/* ========================= ENROLL USER ========================= */
export const enrollUser = async (userId, roadmapId) => {
  /* ========================= PARALLEL PRE-CHECKS ========================= */
  const [roadmap, activeEnrollments, existingEnrollment] =
    await Promise.all([
      Roadmap.findById(roadmapId),
      Enrollment.countDocuments({ userId, status: "active" }),
      Enrollment.findOne({ userId, roadmapId })
    ]);

  if (!roadmap || !roadmap.isPublished) {
    throw new AppError("Roadmap not available for enrollment", 404);
  }



 /* ========================= CASE: ALREADY ACTIVE ========================= */
  if (existingEnrollment && existingEnrollment.status === "active") {
    return {
      message: "Already enrolled in this roadmap",
      enrollment: existingEnrollment
    };
  }

  /* ========================= CASE: RE-ACTIVATE DROPPED ========================= */
  if (existingEnrollment && existingEnrollment.status === "dropped") {
    if (activeEnrollments >= 2) {
      throw new AppError(
        "Maximum enrollment limit reached (2 roadmaps allowed)",
        400
      );
    }

    existingEnrollment.status = "active";
    existingEnrollment.startedAt = new Date();
    await existingEnrollment.save();

    // Reactivate community membership
    const community = await Community.findOne({
      roadmapId,
      isActive: true
    });

    if (community) {
      await CommunityMember.findOneAndUpdate(
        {
          communityId: community._id,
          userId
        },
        {
          isActive: true
        },
        { upsert: true }
      );
    }

    return {
      message: "Enrollment reactivated",
      enrollment: existingEnrollment
    };
  }
  /* ========================= CASE: NEW ENROLLMENT ========================= */
  if (activeEnrollments >= 2) {
    throw new AppError(
      "Maximum enrollment limit reached (2 roadmaps allowed)",
      400
    );
  }

  /* ========================= CREATE ENROLLMENT ========================= */
  const enrollment = await Enrollment.create({
    userId,
    roadmapId,
    status: "active"
  });

  logger.info("Enrollment created:", enrollment);
  /* ========================= COMMUNITY JOIN ========================= */
  const community = await Community.findOne({
    roadmapId,
    isActive: true
  });
  logger.info("Found community:", community);

  if (community) {
    const isAlreadyMember = await CommunityMember.exists({
      communityId: community._id,
      userId
    });
    logger.info("Is already member:", isAlreadyMember);

    if (!isAlreadyMember) {
      await CommunityMember.create({
        communityId: community._id,
        userId,
        role: "learner"
      });

      logger.info("User added to community as learner");
    }
  }

  return {
    message: "Enrollment successful",
    enrollment
  };
};

/* ========================= GET USER ENROLLMENTS ========================= */
export const getMyEnrollments = async (userId) => {
  const enrollments = await Enrollment.find({ userId })
    .select("_id roadmapId status startedAt")
    .populate({
      path: "roadmapId",
      select: "title coverImage level isPaid price"
    })
    .lean();

  return enrollments.map((e) => ({
    enrollmentId: e._id,
    roadmap: {
      id: e.roadmapId._id,
      title: e.roadmapId.title,
      coverImage: e.roadmapId.coverImage,
      level: e.roadmapId.level,
      isPaid: e.roadmapId.isPaid,
      price: e.roadmapId.price
    },
    status: e.status,
    startedAt: e.startedAt
  }));
};

/* ========================= UPDATE ENROLLMENT STATUS ========================= */
export const updateEnrollmentStatus = async (
  enrollmentId,
  userId,
  status
) => {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    userId
  });

  if (!enrollment) {
    throw new AppError("Enrollment not found", 404);
  }

  enrollment.status = status;
  await enrollment.save();

  return enrollment;
};

/* ========================= UNENROLL (DROP) ========================= */
export const dropEnrollment = async (userId, roadmapId) => {
  /* ========================= FIND ENROLLMENT ========================= */
  const enrollment = await Enrollment.findOne({
    userId,
    roadmapId,
    status: "active"
  });

  if (!enrollment) {
    throw new AppError("Active enrollment not found", 404);
  }

  /* ========================= UPDATE ENROLLMENT ========================= */
  enrollment.status = "dropped";
  await enrollment.save();

  /* ========================= DEACTIVATE COMMUNITY MEMBER ========================= */
  const community = await Community.findOne({
    roadmapId,
    isActive: true
  });

  if (community) {
    await CommunityMember.findOneAndUpdate(
      {
        communityId: community._id,
        userId
      },
      {
        isActive: false
      }
    );
  }

  return {
    message: "Enrollment dropped and community access removed",
    enrollmentId: enrollment._id
  };
};
