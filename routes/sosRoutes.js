import express from "express";

import {
  listEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  triggerSos,
  getMySosIncidents,
} from "../controllers/sosController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/emergency", listEmergencyContacts);
router.post("/emergency", addEmergencyContact);
router.delete("/emergency/:id", deleteEmergencyContact);

router.post("/sos", triggerSos);
router.get("/sos/mine", getMySosIncidents);

export default router;