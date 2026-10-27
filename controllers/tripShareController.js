import crypto from "crypto";
import pool from "../config/db.js";

export async function createTripShare(req, res) {
  try {
    const rideId = Number(req.params.id);
    const userId = Number(req.user.id);

    if (!Number.isInteger(rideId) || rideId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    // ---------------------------------------------------------
    // 1. Check that the ride exists
    // ---------------------------------------------------------

    const [rideRows] = await pool.execute(
      `SELECT
          id,
          driver_id,
          status
       FROM rides
       WHERE id = ?
       LIMIT 1`,
      [rideId]
    );

    if (rideRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const ride = rideRows[0];

    // ---------------------------------------------------------
    // 2. Verify that the current user can share this ride
    // ---------------------------------------------------------

    if (Number(ride.driver_id) !== userId) {
      const [bookingRows] = await pool.execute(
        `SELECT
            id,
            status
         FROM bookings
         WHERE ride_id = ?
           AND passenger_id = ?
           AND status IN ('confirmed', 'completed')
         ORDER BY id DESC
         LIMIT 1`,
        [rideId, userId]
      );

      if (bookingRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to share this ride",
        });
      }
    }

    // ---------------------------------------------------------
    // 3. Generate secure random token
    // ---------------------------------------------------------

    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // ---------------------------------------------------------
    // 4. Store ONLY the token hash
    // ---------------------------------------------------------

    const [result] = await pool.execute(
      `INSERT INTO trip_shares (
          ride_id,
          created_by,
          token_hash,
          expires_at,
          is_revoked,
          view_count
       )
       VALUES (
          ?,
          ?,
          ?,
          DATE_ADD(NOW(), INTERVAL 7 DAY),
          0,
          0
       )`,
      [
        rideId,
        userId,
        tokenHash,
      ]
    );

    // ---------------------------------------------------------
    // 5. Return the raw token ONCE
    // ---------------------------------------------------------

    return res.status(201).json({
      success: true,
      id: String(result.insertId),
      token,
      ride_id: String(rideId),
      created_by: String(userId),
      expires_in_days: 7,
    });

  } catch (error) {
    console.error("Create trip share error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create trip share",
    });
  }
}