import pool from "../config/db.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authorization.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (decoded.tokenType !== "access") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, role, account_status,
              avatar_url, token_version, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [decoded.userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account was not found",
      });
    }

    if (user.account_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    if (user.token_version !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Your session is no longer valid. Please log in again.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource",
      });
    }

    next();
  };
}