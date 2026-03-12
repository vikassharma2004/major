import express from "express";
import { authenticate } from "../middleware/Auth.middleware.js";
import {
  createNotificationController,
  listMyNotificationsController,
  markNotificationReadController,
  markAllNotificationsReadController,
  deleteNotificationController
} from "../controllers/notification.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", listMyNotificationsController);
router.post("/", createNotificationController);
router.patch("/read-all", markAllNotificationsReadController);
router.patch("/:id/read", markNotificationReadController);
router.delete("/:id", deleteNotificationController);

export default router;
