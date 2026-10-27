import pool from "../config/db.js";
import { emitToAll, emitToUser } from "../utils/socket.js";

function mapContact(row) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: row.contact_name,
    relationship: row.relationship,
    phone: row.phone,
    created_at: row.created_at,
  };
}

function mapIncident(row) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    ride_id: row.ride_id === null ? null : String(row.ride_id),
    location:
      row.latitude !== null && row.longitude !== null
        ? {
            lat: Number(row.latitude),
            lng: Number(row.longitude),
          }
        : null,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function listEmergencyContacts(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          id,
          user_id,
          contact_name,
          relationship,
          phone,
          created_at
       FROM emergency_contacts
       WHERE user_id = ?
       ORDER BY is_primary DESC, created_at ASC`,
      [req.user.id]
    );

    return res.status(200).json(rows.map(mapContact));
  } catch (error) {
    console.error("List emergency contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load emergency contacts",
    });
  }
}

export async function addEmergencyContact(req, res) {
  try {
    const userId = Number(req.user.id);
    const { name, relationship, phone } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid contact name",
      });
    }

    if (!relationship || !relationship.trim()) {
      return res.status(400).json({
        success: false,
        message: "Enter the relationship",
      });
    }

    if (!phone || !/^[+0-9 ()-]{8,18}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO emergency_contacts (
          user_id,
          contact_name,
          relationship,
          phone
       )
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        relationship.trim(),
        phone.trim(),
      ]
    );

    const [rows] = await pool.execute(
      `SELECT
          id,
          user_id,
          contact_name,
          relationship,
          phone,
          created_at
       FROM emergency_contacts
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json(mapContact(rows[0]));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This emergency contact already exists",
      });
    }

    console.error("Add emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add emergency contact",
    });
  }
}

export async function deleteEmergencyContact(req, res) {
  try {
    const [result] = await pool.execute(
      `DELETE FROM emergency_contacts
       WHERE id = ?
         AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found",
      });
    }

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    console.error("Delete emergency contact error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete emergency contact",
    });
  }
}

export async function triggerSos(req, res) {
  try {
    const userId = Number(req.user.id);
    const rideId =
      req.body.ride_id === null ||
      req.body.ride_id === undefined ||
      req.body.ride_id === ""
        ? null
        : Number(req.body.ride_id);

    const location = req.body.location ?? null;

    let latitude = null;
    let longitude = null;

    if (location) {
      latitude = Number(location.lat);
      longitude = Number(location.lng);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid SOS location",
        });
      }
    }

    // ---------------------------------------------------------
    // Verify ride participation when ride_id is provided
    // ---------------------------------------------------------

    if (rideId !== null) {
      const [rideRows] = await pool.execute(
        `SELECT id, driver_id
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

      if (Number(ride.driver_id) !== userId) {
        const [bookingRows] = await pool.execute(
          `SELECT id
           FROM bookings
           WHERE ride_id = ?
             AND passenger_id = ?
             AND status IN ('confirmed', 'completed')
           LIMIT 1`,
          [rideId, userId]
        );

        if (bookingRows.length === 0) {
          return res.status(403).json({
            success: false,
            message: "You are not a participant in this ride",
          });
        }
      }
    }

    // ---------------------------------------------------------
    // Create SOS incident
    // ---------------------------------------------------------

    const [result] = await pool.execute(
      `INSERT INTO sos_incidents (
          user_id,
          ride_id,
          latitude,
          longitude,
          status
       )
       VALUES (?, ?, ?, ?, 'triggered')`,
      [
        userId,
        rideId,
        latitude,
        longitude,
      ]
    );

    const [incidentRows] = await pool.execute(
      `SELECT
          id,
          user_id,
          ride_id,
          latitude,
          longitude,
          status,
          created_at
       FROM sos_incidents
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const incident = mapIncident(incidentRows[0]);

    // ---------------------------------------------------------
    // Get triggering user's name
    // ---------------------------------------------------------

    const [userRows] = await pool.execute(
      `SELECT id, full_name
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    const userName =
      userRows[0]?.full_name || "A UniRide user";

    // ---------------------------------------------------------
    // Notify all admins
    // ---------------------------------------------------------

    const [admins] = await pool.execute(
      `SELECT id
       FROM users
       WHERE role = 'admin'`
    );

    for (const admin of admins) {
      await pool.execute(
        `INSERT INTO notifications (
            user_id,
            ride_id,
            type,
            title,
            message,
            data_json
         )
         VALUES (?, ?, 'sos_alert', ?, ?, ?)`,
        [
          admin.id,
          rideId,
          "SOS Alert",
          `${userName} triggered an emergency SOS.`,
          JSON.stringify({
            incident_id: String(result.insertId),
            user_id: String(userId),
            ride_id: rideId ? String(rideId) : null,
            location: incident.location,
          }),
        ]
      );

      emitToUser(
        admin.id,
        "sos:triggered",
        incident
      );
    }

    // ---------------------------------------------------------
    // Notify driver if passenger triggered SOS
    // ---------------------------------------------------------

    if (rideId !== null) {
      const [driverRows] = await pool.execute(
        `SELECT driver_id
         FROM rides
         WHERE id = ?
         LIMIT 1`,
        [rideId]
      );

      const driverId = driverRows[0]?.driver_id;

      if (
        driverId &&
        Number(driverId) !== userId
      ) {
        await pool.execute(
          `INSERT INTO notifications (
              user_id,
              ride_id,
              type,
              title,
              message,
              data_json
           )
           VALUES (?, ?, 'sos_alert', ?, ?, ?)`,
          [
            driverId,
            rideId,
            "Passenger SOS Alert",
            `${userName} triggered SOS during your ride.`,
            JSON.stringify({
              incident_id: String(result.insertId),
            }),
          ]
        );

        emitToUser(
          driverId,
          "sos:triggered",
          incident
        );
      }
    }

    // ---------------------------------------------------------
    // Broadcast real-time SOS
    // ---------------------------------------------------------

    emitToAll("sos:triggered", incident);

    return res.status(201).json(incident);
  } catch (error) {
    console.error("Trigger SOS error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to trigger SOS",
    });
  }
}

export async function getMySosIncidents(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          id,
          user_id,
          ride_id,
          latitude,
          longitude,
          status,
          created_at
       FROM sos_incidents
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json(rows.map(mapIncident));
  } catch (error) {
    console.error("Get SOS incidents error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load SOS incidents",
    });
  }
}