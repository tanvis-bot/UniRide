import express from "express";

import {
  getMyStudentVerification,
  submitStudentVerification,
} from "../controllers/studentVerificationController.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  verificationUpload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get(
  "/me",
  authenticate,
  authorizeRoles("passenger"),
  getMyStudentVerification
);

router.post(
  "/verify",
  authenticate,
  authorizeRoles("passenger"),
  verificationUpload.single("file"),
  submitStudentVerification
);

export default router;