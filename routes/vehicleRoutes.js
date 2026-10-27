import express from "express";
import {
  createVehicle,
  listVehicles,
  removeVehicle,
  updateVehicle,
} from "../controllers/vehicleController.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";
import { vehicleUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(
  authenticate,
  authorizeRoles("driver")
);

router.get("/", listVehicles);

router.post(
  "/",
  vehicleUpload.single("registration_document"),
  createVehicle
);

router.patch("/:id", updateVehicle);

router.delete("/:id", removeVehicle);

export default router;