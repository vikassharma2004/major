import { Notification } from "../models/system/Notification.modal.js";
import { AppError } from "../middleware/ErrorHanlder.js";
import { emitToUser } from "../sockets/index.js";

export const createNotification = async ({ userId, message }) => {
  const notification = await Notification.create({
    userId,
    message
  });

  emitToUser(userId, "notification:new", notification);
  return notification;
};

export const getNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false }
) => {
  const query = { userId };
  if (unreadOnly) query.read = false;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query)
  ]);

  return {
    items,
    page,
    limit,
    total
  };
};

export const markNotificationRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (!notification.read) {
    notification.read = true;
    await notification.save();
  }

  return notification;
};

export const markAllNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );

  return { modifiedCount: result.modifiedCount };
};

export const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    userId
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  await notification.deleteOne();
};
