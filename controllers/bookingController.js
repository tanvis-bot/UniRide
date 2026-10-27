import pool from "../config/db.js";

function frontendRideStatus(status) {
  if (status === "in_progress") {
    return "active";
  }

  return status;
}

function frontendRideStage(status) {
  if (status === "in_progress") {
    return "in_progress";
  }

  if (status === "completed") {
    return "completed";
  }

  return "starting_soon";
}

export async function getMyBookings(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          b.id AS booking_id,
          b.ride_id,
          b.passenger_id,
          b.seats_booked,
          b.base_fare,
          b.student_discount_amount,
          b.final_fare,
          b.status AS booking_status,
          b.created_at AS booking_created_at,
          b.updated_at AS booking_updated_at,

          r.driver_id,
          r.vehicle_id,
          r.source_address,
          r.source_latitude,
          r.source_longitude,
          r.destination_address,
          r.destination_latitude,
          r.destination_longitude,
          DATE_FORMAT(r.departure_datetime, '%Y-%m-%d')
            AS departure_date,
          TIME_FORMAT(r.departure_datetime, '%H:%i:%s')
            AS departure_time,
          r.total_seats,
          r.available_seats,
          r.estimated_total_cost,
          r.distance_km,
          r.estimated_duration_minutes,
          r.status AS ride_status,
          r.created_at AS ride_created_at,
          r.updated_at AS ride_updated_at,

          d.full_name AS driver_name,
          d.email AS driver_email,
          d.phone AS driver_phone,
          d.avatar_url AS driver_avatar,

          v.make AS vehicle_make,
          v.model AS vehicle_model,
          v.registration_number,
          v.color AS vehicle_color,
          v.total_seats AS vehicle_seats

       FROM bookings b
       INNER JOIN rides r ON r.id = b.ride_id
       INNER JOIN users d ON d.id = r.driver_id
       LEFT JOIN vehicles v ON v.id = r.vehicle_id
       WHERE b.passenger_id = ?
       ORDER BY r.departure_datetime DESC`,
      [req.user.id]
    );

    const bookings = rows.map((row) => ({
      id: String(row.booking_id),
      ride_id: String(row.ride_id),
      passenger_id: String(row.passenger_id),
      seats: row.seats_booked,
      base_fare: Number(row.base_fare),
      discount: Number(row.student_discount_amount),
      final_fare: Number(row.final_fare),
      status: row.booking_status,
      created_at: row.booking_created_at,
      updated_at: row.booking_updated_at,

      ride: {
        id: String(row.ride_id),
        driver_id: String(row.driver_id),
        vehicle_id: String(row.vehicle_id),
        source: row.source_address,
        destination: row.destination_address,

        source_coords: {
          lat: Number(row.source_latitude),
          lng: Number(row.source_longitude),
        },

        dest_coords: {
          lat: Number(row.destination_latitude),
          lng: Number(row.destination_longitude),
        },

        departure_date: row.departure_date,
        departure_time: row.departure_time,
        total_seats: row.total_seats,
        available_seats: row.available_seats,
        total_cost: Number(row.estimated_total_cost),
        distance_km: Number(row.distance_km || 0),
        duration_min: row.estimated_duration_minutes || 0,
        status: frontendRideStatus(row.ride_status),
        stage: frontendRideStage(row.ride_status),
        driver_location: null,
        location_updated_at: null,
        notes: "",
        created_at: row.ride_created_at,
        updated_at: row.ride_updated_at,

        driver: {
          id: String(row.driver_id),
          full_name: row.driver_name,
          email: row.driver_email,
          phone: row.driver_phone,
          role: "driver",
          status: "active",
          avatar_url: row.driver_avatar || "",
          rating: 0,
          total_trips: 0,
          created_at: "",
          updated_at: "",
        },

        vehicle: row.vehicle_id
          ? {
              id: String(row.vehicle_id),
              driver_id: String(row.driver_id),
              make: row.vehicle_make,
              model: row.vehicle_model,
              number: row.registration_number,
              color: row.vehicle_color,
              seats: row.vehicle_seats,
              registration_doc: "",
              created_at: "",
            }
          : null,
      },
    }));

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your bookings",
    });
  }
}
export async function createBooking(req, res) {
  const connection = await pool.getConnection();

  try {
    const rideId = req.body.ride_id;
    const seats = Number(req.body.seats);

    if (!rideId) {
      return res.status(400).json({
        success: false,
        message: "Ride is required",
      });
    }

    if (
      !Number.isInteger(seats) ||
      seats < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid number of seats",
      });
    }

    await connection.beginTransaction();

    const [rideRows] = await connection.execute(
      `SELECT
          id,
          driver_id,
          available_seats,
          estimated_total_cost,
          status
       FROM rides
       WHERE id = ?
       FOR UPDATE`,
      [rideId]
    );

    const ride = rideRows[0];

    if (!ride) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status !== "scheduled") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "This ride is not available for booking",
      });
    }

    if (
      Number(ride.driver_id) ===
      Number(req.user.id)
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "You cannot book your own ride",
      });
    }

    if (
      seats > Number(ride.available_seats)
    ) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "Not enough seats are available",
      });
    }

    const [existingRows] =
      await connection.execute(
        `SELECT id
         FROM bookings
         WHERE ride_id = ?
           AND passenger_id = ?
         LIMIT 1`,
        [rideId, req.user.id]
      );

    if (existingRows.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          "You already have a booking for this ride",
      });
    }

    const [confirmedRows] =
      await connection.execute(
        `SELECT COUNT(*) AS total
         FROM bookings
         WHERE ride_id = ?
           AND status = 'confirmed'`,
        [rideId]
      );

    const passengerCount =
      Number(confirmedRows[0].total) + 1;

    const totalRideCost = Number(
      ride.estimated_total_cost
    );

    const perSeatFare = Math.round(
      totalRideCost /
        Math.max(1, passengerCount)
    );

    const baseFare = perSeatFare * seats;

    const [studentRows] =
      await connection.execute(
        `SELECT status
         FROM student_verifications
         WHERE user_id = ?
         LIMIT 1`,
        [req.user.id]
      );

    const studentApproved =
      studentRows[0]?.status === "approved";

    const discountPercent =
      studentApproved ? 15 : 0;

    const discountAmount =
      studentApproved
        ? Math.round(baseFare * 0.15)
        : 0;

    const finalFare =
      baseFare - discountAmount;

    const [bookingResult] =
      await connection.execute(
        `INSERT INTO bookings (
            ride_id,
            passenger_id,
            seats_booked,
            total_ride_cost,
            passenger_count_at_booking,
            base_fare,
            student_discount_percent,
            student_discount_amount,
            final_fare,
            status
         )
         VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending'
         )`,
        [
          rideId,
          req.user.id,
          seats,
          totalRideCost,
          passengerCount,
          baseFare,
          discountPercent,
          discountAmount,
          finalFare,
        ]
      );

    await connection.execute(
      `UPDATE rides
       SET available_seats =
         available_seats - ?
       WHERE id = ?`,
      [seats, rideId]
    );

    await connection.execute(
      `INSERT INTO notifications (
          user_id,
          ride_id,
          booking_id,
          type,
          title,
          message
       )
       VALUES (
          ?, ?, ?, 'booking_request',
          'New booking request',
          ?
       )`,
      [
        ride.driver_id,
        rideId,
        bookingResult.insertId,
        `${req.user.full_name} requested ${seats} seat${seats > 1 ? "s" : ""}.`,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      id: String(bookingResult.insertId),
      ride_id: String(rideId),
      passenger_id: String(req.user.id),
      seats,
      base_fare: baseFare,
      discount: discountAmount,
      final_fare: finalFare,
      status: "pending",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Create booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the booking",
    });
  } finally {
    connection.release();
  }
}
export async function getBookingById(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          b.id AS booking_id,
          b.ride_id,
          b.passenger_id,
          b.seats_booked,
          b.base_fare,
          b.student_discount_amount,
          b.final_fare,
          b.status AS booking_status,
          b.created_at AS booking_created_at,
          b.updated_at AS booking_updated_at,

          r.driver_id,
          r.vehicle_id,
          r.source_address,
          r.source_latitude,
          r.source_longitude,
          r.destination_address,
          r.destination_latitude,
          r.destination_longitude,

          DATE_FORMAT(
            r.departure_datetime,
            '%Y-%m-%d'
          ) AS departure_date,

          TIME_FORMAT(
            r.departure_datetime,
            '%H:%i:%s'
          ) AS departure_time,

          r.total_seats,
          r.available_seats,
          r.estimated_total_cost,
          r.distance_km,
          r.estimated_duration_minutes,
          r.route_geometry,
          r.notes,
          r.status AS ride_status,
          r.created_at AS ride_created_at,
          r.updated_at AS ride_updated_at,

          d.full_name AS driver_name,
          d.email AS driver_email,
          d.phone AS driver_phone,
          d.avatar_url AS driver_avatar,

          dv.status AS verification_status,

          v.make AS vehicle_make,
          v.model AS vehicle_model,
          v.manufacturing_year,
          v.registration_number,
          v.color AS vehicle_color,
          v.total_seats AS vehicle_seats

       FROM bookings b

       INNER JOIN rides r
         ON r.id = b.ride_id

       INNER JOIN users d
         ON d.id = r.driver_id

       LEFT JOIN driver_verifications dv
         ON dv.user_id = r.driver_id

       LEFT JOIN vehicles v
         ON v.id = r.vehicle_id

       WHERE b.id = ?
         AND b.passenger_id = ?

       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    const row = rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    let route = [];

    try {
      route =
        typeof row.route_geometry === "string"
          ? JSON.parse(row.route_geometry)
          : row.route_geometry || [];
    } catch {
      route = [];
    }

    return res.status(200).json({
      id: String(row.booking_id),
      ride_id: String(row.ride_id),
      passenger_id: String(row.passenger_id),
      seats: row.seats_booked,
      base_fare: Number(row.base_fare),

      discount: Number(
        row.student_discount_amount
      ),

      final_fare: Number(row.final_fare),
      status: row.booking_status,
      created_at: row.booking_created_at,
      updated_at: row.booking_updated_at,

      ride: {
        id: String(row.ride_id),
        driver_id: String(row.driver_id),
        vehicle_id: String(row.vehicle_id),
        source: row.source_address,
        destination: row.destination_address,

        source_coords: {
          lat: Number(row.source_latitude),
          lng: Number(row.source_longitude),
        },

        dest_coords: {
          lat: Number(row.destination_latitude),
          lng: Number(row.destination_longitude),
        },

        departure_date: row.departure_date,
        departure_time: row.departure_time,
        total_seats: row.total_seats,
        available_seats: row.available_seats,
        total_cost: Number(row.estimated_total_cost),
        distance_km: Number(row.distance_km || 0),

        duration_min:
          row.estimated_duration_minutes || 0,

        status:
          row.ride_status === "in_progress"
            ? "active"
            : row.ride_status,

        stage: "starting_soon",
        driver_location: null,
        location_updated_at: null,
        notes: row.notes || "",
        route,
        created_at: row.ride_created_at,
        updated_at: row.ride_updated_at,

        driver: {
          id: String(row.driver_id),
          full_name: row.driver_name,
          email: row.driver_email,
          phone: row.driver_phone,
          role: "driver",
          status: "active",
          avatar_url: row.driver_avatar || "",
          rating: 0,
          total_trips: 0,

          verified:
            row.verification_status ===
            "approved",

          created_at: "",
          updated_at: "",
        },

        vehicle: row.vehicle_id
          ? {
              id: String(row.vehicle_id),
              driver_id: String(row.driver_id),
              make: row.vehicle_make,
              model: row.vehicle_model,

              manufacturing_year: Number(
                row.manufacturing_year
              ),

              number: row.registration_number,
              color: row.vehicle_color,
              seats: row.vehicle_seats,
              registration_doc: "",
              created_at: "",
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get booking details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load booking details",
    });
  }
}
export async function getDriverBookingRequests(req, res) {
  try {
    const driverId = req.user.id;

    const [rows] = await pool.execute(
      `SELECT
        b.id,
        b.ride_id,
        b.passenger_id,
        b.seats_booked,
        b.base_fare,
        b.student_discount_percent AS student_discount,
        b.final_fare,
        b.status,
        b.created_at,
        b.updated_at,

        r.source_address AS source,
r.destination_address AS destination,
DATE_FORMAT(r.departure_datetime, '%Y-%m-%d') AS departure_date,
TIME_FORMAT(r.departure_datetime, '%H:%i:%s') AS departure_time,

        u.full_name AS passenger_name,
        u.email AS passenger_email,
        u.phone AS passenger_phone,
        u.avatar_url AS passenger_avatar,

        CASE
          WHEN sv.status = 'approved' THEN TRUE
          ELSE FALSE
        END AS student_verified

      FROM bookings b

      INNER JOIN rides r
        ON r.id = b.ride_id

      INNER JOIN users u
        ON u.id = b.passenger_id

      LEFT JOIN student_verifications sv
        ON sv.user_id = b.passenger_id

      WHERE r.driver_id = ?

      ORDER BY
        CASE WHEN b.status = 'pending' THEN 0 ELSE 1 END,
        b.created_at DESC`,
      [driverId]
    );

    const requests = rows.map((row) => ({
      id: row.id,
      ride_id: row.ride_id,
      passenger_id: row.passenger_id,
      seats_booked: row.seats_booked,
      base_fare: Number(row.base_fare),
      student_discount: Number(row.student_discount),
      final_fare: Number(row.final_fare),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,

      ride: {
        id: row.ride_id,
        source: row.source,
        destination: row.destination,
        departure_date: row.departure_date,
        departure_time: row.departure_time,
      },

      passenger: {
        id: row.passenger_id,
        full_name: row.passenger_name,
        email: row.passenger_email,
        phone: row.passenger_phone,
        avatar_url: row.passenger_avatar,
        role: "passenger",
      },

      student_verified: Boolean(row.student_verified),
    }));

    return res.status(200).json(requests);
  } catch (error) {
    console.error("Get driver booking requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load booking requests",
    });
  }
}
export async function decideBooking(req, res) {
  const connection = await pool.getConnection();

  try {
    const driverId = req.user.id;
    const bookingId = Number(req.params.id);
    const { decision } = req.body;

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (!["accept", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be accept or reject",
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT
        b.id,
        b.ride_id,
        b.passenger_id,
        b.seats_booked,
        b.status,
        r.driver_id
      FROM bookings b
      INNER JOIN rides r ON r.id = b.ride_id
      WHERE b.id = ?
      FOR UPDATE`,
      [bookingId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking request not found",
      });
    }

    const booking = rows[0];

    if (Number(booking.driver_id) !== Number(driverId)) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "You cannot manage this booking request",
      });
    }

    if (booking.status !== "pending") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `This booking is already ${booking.status}`,
      });
    }

    const newStatus = decision === "accept" ? "confirmed" : "rejected";

    await connection.execute(
      `UPDATE bookings
       SET status = ?
       WHERE id = ?`,
      [newStatus, bookingId]
    );

    // Seats were reserved when the passenger created the booking.
    // If the driver rejects it, those seats must become available again.
    if (decision === "reject") {
      await connection.execute(
        `UPDATE rides
         SET available_seats = available_seats + ?
         WHERE id = ?`,
        [booking.seats_booked, booking.ride_id]
      );
    }
    const notificationType =
  decision === "accept"
    ? "booking_confirmed"
    : "booking_rejected";

const notificationTitle =
  decision === "accept"
    ? "Booking confirmed"
    : "Booking rejected";

const notificationMessage =
  decision === "accept"
    ? "Your booking request has been accepted by the driver."
    : "Your booking request has been rejected by the driver.";

await connection.execute(
  `INSERT INTO notifications
    (
      user_id,
      ride_id,
      booking_id,
      type,
      title,
      message,
      data_json,
      is_read
    )
   VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
  [
    booking.passenger_id,
    booking.ride_id,
    booking.id,
    notificationType,
    notificationTitle,
    notificationMessage,
    JSON.stringify({
      ride_id: booking.ride_id,
      booking_id: booking.id,
      status: newStatus,
    }),
  ]
);
    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        decision === "accept"
          ? "Booking request accepted"
          : "Booking request rejected",
      booking: {
        id: booking.id,
        ride_id: booking.ride_id,
        passenger_id: booking.passenger_id,
        seats_booked: booking.seats_booked,
        status: newStatus,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Booking decision error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update booking request",
    });
  } finally {
    connection.release();
  }
}

export async function cancelBooking(req, res) {
  const connection = await pool.getConnection();

  try {
    const passengerId = req.user.id;
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT
          b.id,
          b.ride_id,
          b.passenger_id,
          b.seats_booked,
          b.status,
          r.status AS ride_status,
          r.driver_id
       FROM bookings b
       INNER JOIN rides r ON r.id = b.ride_id
       WHERE b.id = ?
       FOR UPDATE`,
      [bookingId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = rows[0];

    if (Number(booking.passenger_id) !== Number(passengerId)) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "You cannot cancel this booking",
      });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `This booking is already ${booking.status}`,
      });
    }

    if (booking.ride_status !== "scheduled") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "This booking cannot be cancelled after the ride has started",
      });
    }

    await connection.execute(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = ?`,
      [bookingId]
    );

    await connection.execute(
      `UPDATE rides
       SET available_seats = available_seats + ?
       WHERE id = ?`,
      [booking.seats_booked, booking.ride_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        id: booking.id,
        ride_id: booking.ride_id,
        status: "cancelled",
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Cancel booking error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel booking",
    });
  } finally {
    connection.release();
  }
}