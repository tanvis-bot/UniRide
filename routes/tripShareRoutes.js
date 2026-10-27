import express from "express";
import { getSharedTrip } from "../controllers/tripShareViewController.js";

const router = express.Router();

router.get("/:token", getSharedTrip);

export default router;