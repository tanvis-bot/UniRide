import crypto from "crypto";
import pool from "../config/db.js";

export async function getSharedTrip(req, res) {
  try {
    const { token } = req.params;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid share token",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [rows] = await pool.execute(
      `SELECT
          ts.id AS share_id,
          ts.ride_id,
          ts.created_by,
          ts.expires_at,
          ts.is_revoked,
          ts.view_count,

          r.source_address,
          r.source_latitude,
          r.source_longitude,

          r.destination_address,
          r.destination_latitude,
          r.destination_longitude,

          r.departure_datetime,

          r.total_seats,
          r.available_seats,
          r.estimated_total_cost,

          r.distance_km,
          r.estimated_duration_minutes,
          r.route_geometry,

          r.status,
          r.started_at,
          r.completed_at,

          r.current_latitude,
          r.current_longitude,
          r.location_updated_at,

          u.id AS driver_id,
          u.full_name AS driver_name,
          u.phone AS driver_phone,
          u.avatar_url AS driver_avatar,

          v.id AS vehicle_id,
          v.make AS vehicle_make,
          v.model AS vehicle_model,
          v.registration_number AS vehicle_number,
          v.color AS vehicle_color,
          v.total_seats AS vehicle_seats

       FROM trip_shares ts

       INNER JOIN rides r
         ON r.id = ts.ride_id

       INNER JOIN users u
         ON u.id = r.driver_id

       LEFT JOIN vehicles v
         ON v.id = r.vehicle_id

       WHERE ts.token_hash = ?

       LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Shared trip not found",
      });
    }

    const trip = rows[0];

    if (trip.is_revoked) {
      return res.status(410).json({
        success: false,
        message: "This trip link has been revoked",
      });
    }

    if (new Date(trip.expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        message: "This trip link has expired",
      });
    }

    await pool.execute(
      `UPDATE trip_shares
       SET
         view_count = view_count + 1,
         last_viewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [trip.share_id]
    );

    const departureDate = trip.departure_datetime
      ? new Date(trip.departure_datetime)
          .toISOString()
          .split("T")[0]
      : null;

    const departureTime = trip.departure_datetime
      ? new Date(trip.departure_datetime)
          .toTimeString()
          .slice(0, 8)
      : null;

    let route = [];

    try {
      if (trip.route_geometry) {
        const parsed =
          typeof trip.route_geometry === "string"
            ? JSON.parse(trip.route_geometry)
            : trip.route_geometry;

        route = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      route = [];
    }

    return res.status(200).json({
      success: true,

      share: {
        id: String(trip.share_id),
        ride_id: String(trip.ride_id),
        created_by: String(trip.created_by),
        expires_at: trip.expires_at,
        view_count: Number(trip.view_count) + 1,
      },

      ride: {
        id: String(trip.ride_id),

        source: trip.source_address,
        destination: trip.destination_address,

        source_coords: {
          lat: Number(trip.source_latitude),
          lng: Number(trip.source_longitude),
        },

        dest_coords: {
          lat: Number(trip.destination_latitude),
          lng: Number(trip.destination_longitude),
        },

        departure_date: departureDate,
        departure_time: departureTime,

        total_seats: Number(trip.total_seats),
        available_seats: Number(trip.available_seats),

        total_cost: Number(trip.estimated_total_cost),

        distance_km:
          trip.distance_km == null
            ? null
            : Number(trip.distance_km),

        duration_min:
          trip.estimated_duration_minutes == null
            ? null
            : Number(trip.estimated_duration_minutes),

        status: trip.status,

        stage: trip.status,

        started_at: trip.started_at,
        completed_at: trip.completed_at,

        route_geometry: trip.route_geometry,

        route,

        // LIVE DRIVER LOCATION
        driver_location:
          trip.current_latitude != null &&
          trip.current_longitude != null
            ? {
                lat: Number(trip.current_latitude),
                lng: Number(trip.current_longitude),
              }
            : null,

        location_updated_at:
          trip.location_updated_at ?? null,

        driver: {
          id: String(trip.driver_id),
          full_name: trip.driver_name,
          phone: trip.driver_phone,
          avatar_url: trip.driver_avatar,
          verified: true,
        },

        vehicle: trip.vehicle_id
          ? {
              id: String(trip.vehicle_id),
              make: trip.vehicle_make,
              model: trip.vehicle_model,
              number: trip.vehicle_number,
              registration_number: trip.vehicle_number,
              color: trip.vehicle_color,
              total_seats:
                trip.vehicle_seats == null
                  ? null
                  : Number(trip.vehicle_seats),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get shared trip error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load shared trip",
    });
  }
}