import express from "express";
import {
  changeMyPassword,
  updateMyProfile,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch(
  "/me",
  authenticate,
  updateMyProfile
);

router.post(
  "/me/password",
  authenticate,
  changeMyPassword
);

export default router;