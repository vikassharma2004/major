import { Roadmap } from "../models/roadmap/Roadmap.model.js";
import { Purchase } from "../models/Profile/purchase.model.js";
import { Enrollment } from "../models/Progress/Enrollment.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import crypto from "crypto";

/* ========================= CREATE PURCHASE ========================= */
export const createRoadmapPurchase = async (userId, roadmapId) => {
  const roadmap = await Roadmap.findById(roadmapId);

  if (!roadmap || !roadmap.isPublished) {
    throw new AppError("Roadmap not available", 404);
  }

  if (!roadmap.isPaid) {
    throw new AppError("This roadmap is free. No purchase required.", 400);
  }

  // prevent double purchase
  const existingPurchase = await Purchase.findOne({
    userId,
    roadmapId,
    status: "success"
  });

  if (existingPurchase) {
    throw new AppError("Roadmap already purchased", 400);
  }

  // prevent active enrollment without payment
  const existingEnrollment = await Enrollment.findOne({
    userId,
    roadmapId,
    status: "active"
  });

  if (existingEnrollment) {
    throw new AppError("Already enrolled in this roadmap", 400);
  }

  // generate orderId (replace with Razorpay order later)
  const orderId = `order_${crypto.randomUUID()}`;

  const purchase = await Purchase.create({
    userId,
    roadmapId,
    amount: roadmap.price,
    provider: "razorpay",
    orderId,
    status: "pending"
  });

  return {
    message: "Purchase initiated",
    purchaseId: purchase._id,
    orderId,
    amount: roadmap.price,
    currency: "INR"
  };
};
