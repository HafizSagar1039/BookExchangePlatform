import express from "express";
const router = express.Router();
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";
import auth from "../middleware/auth.js";

// GET /api/notifications - Get all notifications for logged-in user
router.get("/", auth, getNotifications);

// PATCH /api/notifications/:id/read - Mark one notification as read
router.put("/read/:id", auth, markNotificationAsRead);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", auth, markAllNotificationsAsRead);

export default router;
