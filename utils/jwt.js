import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  console.warn("Warning: JWT_ACCESS_SECRET is not configured");
}

if (!REFRESH_TOKEN_SECRET) {
  console.warn("Warning: JWT_REFRESH_SECRET is not configured");
}

export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      tokenVersion: user.token_version,
      tokenType: "access",
    },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      tokenVersion: user.token_version,
      tokenType: "refresh",
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

export function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}