import express from "express";

import {
  cancelRide,
  createRide,
  getActiveRide,
  getFareQuote,
  getMyRides,
  getRideById,
  pushRideLocation,
  searchRides,
  updateRideStatus,
} from "../controllers/rideController.js";

import { createTripShare } from "../controllers/tripShareController.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("passenger"),
  searchRides
);

router.post(
  "/",
  authenticate,
  authorizeRoles("driver"),
  createRide
);

router.get(
  "/mine",
  authenticate,
  authorizeRoles("driver"),
  getMyRides
);

router.get(
  "/active",
  authenticate,
  authorizeRoles("passenger", "driver"),
  getActiveRide
);

router.post(
  "/:id/status",
  authenticate,
  authorizeRoles("driver"),
  updateRideStatus
);

router.post(
  "/:id/location",
  authenticate,
  authorizeRoles("driver"),
  pushRideLocation
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles("driver"),
  cancelRide
);

router.post(
  "/:id/share",
  authenticate,
  authorizeRoles("passenger", "driver"),
  createTripShare
);

router.get(
  "/:id",
  authenticate,
  getRideById
);
 
router.get(
  "/:id/fare-quote",
  authenticate,
  authorizeRoles("passenger"),
  getFareQuote
);

export default router;