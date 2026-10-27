import express from "express";
import {
  getDriverVerification,
  submitDriverVerification,
} from "../controllers/driverVerificationController.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import { verificationUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get(
  "/me/verification",
  authenticate,
  authorizeRoles("driver"),
  getDriverVerification
);

router.post(
  "/verify",
  authenticate,
  authorizeRoles("driver"),
  verificationUpload.fields([
    {
      name: "licence_document",
      maxCount: 1,
    },
    {
      name: "government_id_document",
      maxCount: 1,
    },
  ]),
  submitDriverVerification
);

export default router;