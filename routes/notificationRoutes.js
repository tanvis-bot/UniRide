import express from "express";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getMyNotifications);

router.post(
  "/read-all",
  authenticate,
  markAllNotificationsRead
);

router.post(
  "/:id/read",
  authenticate,
  markNotificationRead
);

export default router;