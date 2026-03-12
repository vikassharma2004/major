import {
  enrollUser,
  getMyEnrollments,
  updateEnrollmentStatus,
  dropEnrollment
} from "../services/enrollment.service.js";

import {
  updateEnrollmentStatusSchema
} from "../validators/enrollment.validation.js";

import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= ENROLL ========================= */
export const enrollController = catchAsyncError(async (req, res) => {
  const { roadmapId } = req.params;

  if (!roadmapId) {
    throw new AppError("Roadmap ID is required", 400);
  }

  const { message, enrollment } = await enrollUser(
    req.user.id,
    roadmapId
  );

  res.status(201).json({ message });
});

/* ========================= GET MY ENROLLMENTS ========================= */
export const getMyEnrollmentsController = catchAsyncError(
  async (req, res) => {
    const  enrollments = await getMyEnrollments(req.user.id);
    res.status(200).json(enrollments);
  }
);

/* ========================= UPDATE STATUS ========================= */
export const updateEnrollmentStatusController = catchAsyncError(
  async (req, res) => {
    const { error } = updateEnrollmentStatusSchema.validate(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    const enrollment = await updateEnrollmentStatus(
      req.params.id,
      req.user.id,
      req.body.status
    );

    res.json(enrollment);
  }
);

/* ========================= DROP ENROLLMENT ========================= */
export const dropEnrollmentController = catchAsyncError(
  async (req, res) => {

    const roadmapId = req.params.roadmapId;
    if (!roadmapId) {
      throw new AppError("Roadmap ID is required", 400);
    }
    const { message, enrollmentId} = await dropEnrollment(
      req.user.id,
      roadmapId
    );

   res.status(200).json({ message, enrollmentId  });
  }
);
