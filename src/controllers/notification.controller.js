import {
  createNotification,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from "../services/notification.service.js";
import {
  createNotificationSchema,
  listNotificationQuerySchema
} from "../validators/notification.validation.js";
import { catchAsyncError } from "../middleware/CatchAsyncError.js";
import { AppError } from "../middleware/ErrorHanlder.js";

/* ========================= CREATE ========================= */
export const createNotificationController = catchAsyncError(async (req, res) => {
  const { error } = createNotificationSchema.validate(req.body);
  if (error) throw new AppError(error.details[0].message, 400);

  const { userId, message } = req.body;
  if (req.user.role !== "admin" && req.user.id !== userId) {
    throw new AppError("Not authorized to notify this user", 403);
  }

  const notification = await createNotification({ userId, message });
  res.status(201).json(notification);
});

/* ========================= LIST ========================= */
export const listMyNotificationsController = catchAsyncError(async (req, res) => {
  const { error, value } = listNotificationQuerySchema.validate(req.query);
  if (error) throw new AppError(error.details[0].message, 400);

  const result = await getNotifications(req.user.id, value);
  res.json(result);
});

/* ========================= MARK READ ========================= */
export const markNotificationReadController = catchAsyncError(async (req, res) => {
  const notification = await markNotificationRead(req.user.id, req.params.id);
  res.json(notification);
});

/* ========================= MARK ALL READ ========================= */
export const markAllNotificationsReadController = catchAsyncError(async (req, res) => {
  const result = await markAllNotificationsRead(req.user.id);
  res.json(result);
});

/* ========================= DELETE ========================= */
export const deleteNotificationController = catchAsyncError(async (req, res) => {
  await deleteNotification(req.user.id, req.params.id);
  res.json({ message: "Notification deleted successfully" });
});
