import bcrypt from "bcrypt";
import pool from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/jwt.js";

const REFRESH_COOKIE_NAME = "uniride_refresh_token";
const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: String(user.id),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.account_status,
    account_status: user.account_status,
    avatar_url: user.avatar_url || "",
    rating: Number(user.rating || 0),
    total_trips: Number(user.total_trips || 0),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS_IN_MILLISECONDS,
  });
}

async function getVerificationStatus(userId) {
  const [studentRows] = await pool.execute(
    `SELECT status
     FROM student_verifications
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  const [driverRows] = await pool.execute(
    `SELECT status
     FROM driver_verifications
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return {
    student: studentRows[0]?.status || "not_submitted",
    driver: driverRows[0]?.status || "not_submitted",
  };
}
async function saveRefreshToken(userId, refreshToken, req) {
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + SEVEN_DAYS_IN_MILLISECONDS);

  await pool.execute(
    `INSERT INTO refresh_tokens
      (user_id, token_hash, expires_at, device_info, ip_address)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      refreshTokenHash,
      expiresAt,
      req.get("user-agent") || null,
      req.ip || null,
    ]
  );
}

export async function register(req, res) {
  try {
    const {
      full_name,
      email,
      phone,
      password,
      confirm_password,
      role,
    } = req.body;

    if (!["passenger", "driver"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "You can register only as a passenger or driver",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation password do not match",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    const [existingUsers] = await pool.execute(
      `SELECT id
       FROM users
       WHERE email = ? OR phone = ?
       LIMIT 1`,
      [normalizedEmail, normalizedPhone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.execute(
      `INSERT INTO users
        (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        normalizedEmail,
        normalizedPhone,
        passwordHash,
        role,
      ]
    );

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, role, account_status,
              avatar_url, token_version, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const user = rows[0];
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(user.id, refreshToken, req);
    setRefreshCookie(res, refreshToken);
    const verification = await getVerificationStatus(user.id);
    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: accessToken,
      user: publicUser(user),
      verification: {
        student: "not_submitted",
        driver: "not_submitted",
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, password_hash, role,
              account_status, avatar_url, token_version,
              created_at, updated_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.account_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await saveRefreshToken(user.id, refreshToken, req);
    setRefreshCookie(res, refreshToken);
    const verification = await getVerificationStatus(user.id);
    return res.status(200).json({
  success: true,
  message: "Login successful",
  token: accessToken,
  user: publicUser(user),
  verification,
  studentApproved: verification.student === "approved",
  driverApproved: verification.driver === "approved",
});
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const verification = await getVerificationStatus(req.user.id);

    return res.status(200).json({
      success: true,
      user: publicUser(req.user),
      verification,
      studentApproved: verification.student === "approved",
      driverApproved: verification.driver === "approved",
    });
  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the current user",
    });
  }
}

export async function logout(req, res) {
  try {
    await pool.execute(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND revoked_at IS NULL`,
      [req.user.id]
    );

    await pool.execute(
      `UPDATE users
       SET token_version = token_version + 1
       WHERE id = ?`,
      [req.user.id]
    );

    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful. Please log in again.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log out",
    });
  }
}