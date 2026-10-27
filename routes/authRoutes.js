import express from "express";
import { body } from "express-validator";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("full_name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must contain between 2 and 100 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

    body("phone")
      .trim()
      .matches(/^[0-9+\-\s]{7,20}$/)
      .withMessage("Enter a valid phone number"),

    body("password")
      .isLength({ min: 8, max: 72 })
      .withMessage("Password must contain between 8 and 72 characters")
      .matches(/[a-z]/)
      .withMessage("Password must contain a lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),

    body("confirm_password")
      .notEmpty()
      .withMessage("Confirm your password"),

    body("role")
      .isIn(["passenger", "driver"])
      .withMessage("Role must be passenger or driver"),
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  validateRequest,
  login
);

router.get("/me", authenticate, getCurrentUser);

router.post("/logout", authenticate, logout);

export default router;