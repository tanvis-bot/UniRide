import bcrypt from "bcrypt";
import pool from "../config/db.js";

function frontendUser(user) {
  return {
    id: String(user.id),
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.account_status,
    account_status: user.account_status,
    avatar_url: user.avatar_url || "",
    rating: 0,
    total_trips: 0,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function updateMyProfile(req, res) {
  try {
    const fullName = req.body.full_name?.trim();
    const phone = req.body.phone?.trim();

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Full name must contain at least 2 characters",
      });
    }

    if (
      !phone ||
      !/^[0-9+\-\s]{7,20}$/.test(phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number",
      });
    }

    await pool.execute(
      `UPDATE users
       SET full_name = ?,
           phone = ?
       WHERE id = ?`,
      [fullName, phone, req.user.id]
    );

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, role,
              account_status, avatar_url,
              created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    return res
      .status(200)
      .json(frontendUser(rows[0]));
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message:
          "This phone number is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
}

export async function changeMyPassword(req, res) {
  try {
    const {
      current_password,
      password,
      confirm_password,
    } = req.body;

    if (
      !current_password ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirmation do not match",
      });
    }

    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, uppercase, lowercase and a number",
      });
    }

    const [rows] = await pool.execute(
      `SELECT password_hash
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    const passwordMatches = await bcrypt.compare(
      current_password,
      rows[0].password_hash
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      password,
      rows[0].password_hash
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      `UPDATE users
       SET password_hash = ?,
           token_version = token_version + 1
       WHERE id = ?`,
      [passwordHash, req.user.id]
    );

    await pool.execute(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ?
         AND revoked_at IS NULL`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
}