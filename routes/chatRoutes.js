import express from "express";

import {
  getChatThreads,
  getChatMessages,
  sendChatMessage,
} from "../controllers/chatController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/threads",
  authenticate,
  getChatThreads
);

router.get(
  "/:rideId/:userId",
  authenticate,
  getChatMessages
);

router.post(
  "/:rideId",
  authenticate,
  sendChatMessage
);

export default router;