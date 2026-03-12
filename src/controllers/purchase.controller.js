import {
  createRoadmapPurchase,
  listMyPurchases,
  getPurchaseById
} from "../services/purchase.service.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";

export const createRoadmapPurchaseController = catchAsyncError(
  async (req, res) => {
    const result = await createRoadmapPurchase(
      req.user.id,
      req.params.roadmapId
    );

    res.status(201).json({
      success: true,
      ...result
    });
  }
);

export const listMyPurchasesController = catchAsyncError(async (req, res) => {
  const result = await listMyPurchases(req.user.id);

  res.status(200).json({
    success: true,
    ...result
  });
});

export const getPurchaseByIdController = catchAsyncError(async (req, res) => {
  const purchase = await getPurchaseById(
    req.params.id,
    req.user.id,
    req.user.role === "admin"
  );

  res.status(200).json({
    success: true,
    purchase
  });
});
