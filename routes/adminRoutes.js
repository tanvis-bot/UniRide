import express from "express";

import {
  getAdminStats,
  getAdminUsers,
  getAdminVerifications,
  reviewVerification,
  updateUserStatus,
  getAdminRides,
  getAdminBookings,
  getAdminIssues,
} from "../controllers/adminController.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("admin"));

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch(
  "/users/:id/status",
  updateUserStatus
);
router.get("/verifications", getAdminVerifications);
router.get("/rides", getAdminRides);
router.get("/bookings", getAdminBookings);
router.post(
  "/verifications/:id/review",
  reviewVerification
);
router.get("/issues", getAdminIssues);

export default router;