import pool from "../config/db.js";
import { emitToRide } from "../utils/socket.js";

export async function getActiveRide(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          r.id,
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
          r.status,
          r.ride_stage,
          r.started_at,
          r.current_latitude,
          r.current_longitude,
          r.location_updated_at,
          r.created_at,
          r.updated_at,

          b.id AS booking_id,
          b.passenger_id,
          b.seats_booked,
          b.base_fare,
          b.student_discount_amount,
          b.final_fare,
          b.status AS booking_status,
          b.created_at AS booking_created_at,
          b.updated_at AS booking_updated_at,

          d.full_name AS driver_name,
          d.email AS driver_email,
          d.phone AS driver_phone,
          d.avatar_url AS driver_avatar,

          dv.status AS verification_status,

          v.make AS vehicle_make,
          v.model AS vehicle_model,
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

       WHERE (
         (? = 'driver' AND r.driver_id = ?)
         OR
         (? = 'passenger' AND b.passenger_id = ?)
       )

       AND b.status = 'confirmed'
       AND r.status = 'in_progress'

       ORDER BY r.started_at DESC
       LIMIT 1`,
      [
        req.user.role,
        req.user.id,
        req.user.role,
        req.user.id,
      ]
    );

    if (rows.length === 0) {
      return res.status(200).json(null);
    }

    const row = rows[0];

    const activeRide = {
      id: String(row.id),
      driver_id: String(row.driver_id),
      vehicle_id: row.vehicle_id
        ? String(row.vehicle_id)
        : null,

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
      duration_min: Number(row.estimated_duration_minutes || 0),

      status: "active",

      stage: row.ride_stage || "in_progress",

      driver_location:
        row.current_latitude != null &&
        row.current_longitude != null
          ? {
              lat: Number(row.current_latitude),
              lng: Number(row.current_longitude),
            }
          : null,

      location_updated_at:
        row.location_updated_at ?? null,

      notes: "",

      created_at: row.created_at,
      updated_at: row.updated_at,

      /* DRIVER OBJECT */
      driver: {
        id: String(row.driver_id),
        full_name: row.driver_name,
        email: row.driver_email,
        phone: row.driver_phone,

        role: "driver",

        status: "active",

        /* IMPORTANT: verification badge */
        verified:
          row.verification_status === "approved",

        avatar_url: row.driver_avatar || "",

        rating: 0,
        total_trips: 0,

        created_at: "",
        updated_at: "",
      },

      /* VEHICLE OBJECT */
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

      /* BOOKING OBJECT */
      booking: {
        id: String(row.booking_id),
        ride_id: String(row.id),
        passenger_id: String(row.passenger_id),

        seats: row.seats_booked,

        base_fare: Number(row.base_fare),
        discount: Number(row.student_discount_amount),
        final_fare: Number(row.final_fare),

        status: row.booking_status,

        created_at: row.booking_created_at,
        updated_at: row.booking_updated_at,
      },
    };

    return res.status(200).json(activeRide);
  } catch (error) {
    console.error("Get active ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the active ride",
    });
  }
}
export async function searchRides(req, res) {
  try {
    const {
      source = "",
      destination = "",
      date = "",
      seats = 1,
      maxFare = "",
      timeBand = "any",
      sort = "departure",
    } = req.query;

    const requestedSeats = Math.max(1, Number(seats) || 1);

    const conditions = [
      "r.status = 'scheduled'",
      "r.available_seats >= ?",
      "dv.status = 'approved'",
      "d.account_status = 'active'",
      "v.is_active = TRUE",
    ];

    const values = [requestedSeats];

    if (source.trim()) {
      conditions.push("r.source_address LIKE ?");
      values.push(`%${source.trim()}%`);
    }

    if (destination.trim()) {
      conditions.push("r.destination_address LIKE ?");
      values.push(`%${destination.trim()}%`);
    }

    if (date.trim()) {
      conditions.push("DATE(r.departure_datetime) = ?");
      values.push(date.trim());
    } else {
      conditions.push("r.departure_datetime >= NOW()");
    }

    if (timeBand === "morning") {
      conditions.push("TIME(r.departure_datetime) < '12:00:00'");
    }

    if (timeBand === "afternoon") {
      conditions.push(
        "TIME(r.departure_datetime) >= '12:00:00'",
        "TIME(r.departure_datetime) < '17:00:00'"
      );
    }

    if (timeBand === "evening") {
      conditions.push("TIME(r.departure_datetime) >= '17:00:00'");
    }

    const [rows] = await pool.execute(
      `SELECT
          r.id,
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
          r.status,
          r.created_at,
          r.updated_at,

          d.full_name AS driver_name,
          d.email AS driver_email,
          d.phone AS driver_phone,
          d.avatar_url AS driver_avatar,

          v.make AS vehicle_make,
          v.model AS vehicle_model,
          v.registration_number,
          v.color AS vehicle_color,
          v.total_seats AS vehicle_seats,

          COALESCE(
            SUM(
              CASE
                WHEN b.status = 'confirmed'
                THEN b.seats_booked
                ELSE 0
              END
            ),
            0
          ) AS confirmed_passengers

       FROM rides r
       INNER JOIN users d
         ON d.id = r.driver_id
       INNER JOIN driver_verifications dv
         ON dv.user_id = r.driver_id
       INNER JOIN vehicles v
         ON v.id = r.vehicle_id
       LEFT JOIN bookings b
         ON b.ride_id = r.id

       WHERE ${conditions.join(" AND ")}

       GROUP BY
         r.id,
         d.id,
         v.id

       ORDER BY r.departure_datetime ASC`,
      values
    );

    let rides = rows.map((row) => {
      const confirmedPassengers =
        Number(row.confirmed_passengers) || 0;

      const perSeatFare = Math.round(
        Number(row.estimated_total_cost) /
          Math.max(1, confirmedPassengers + 1)
      );

      return {
        id: String(row.id),
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
        status: row.status,
        stage: "starting_soon",
        driver_location: null,
        location_updated_at: null,
        notes: "",
        created_at: row.created_at,
        updated_at: row.updated_at,
        confirmed_passengers: confirmedPassengers,
        per_seat_fare: perSeatFare,
        route: [],

        driver: {
          id: String(row.driver_id),
          full_name: row.driver_name,
          email: row.driver_email,
          phone: row.driver_phone,
          role: "driver",
          status: "active",
          verified: true,
          avatar_url: row.driver_avatar || "",
          rating: 0,
          total_trips: 0,
          created_at: "",
          updated_at: "",
        },

        vehicle: {
          id: String(row.vehicle_id),
          driver_id: String(row.driver_id),
          make: row.vehicle_make,
          model: row.vehicle_model,
          number: row.registration_number,
          color: row.vehicle_color,
          seats: row.vehicle_seats,
          registration_doc: "",
          created_at: "",
        },
      };
    });

    if (maxFare !== "") {
      const maximumFare = Number(maxFare);

      if (Number.isFinite(maximumFare)) {
        rides = rides.filter(
          (ride) => ride.per_seat_fare <= maximumFare
        );
      }
    }

    if (sort === "fare") {
      rides.sort((a, b) => a.per_seat_fare - b.per_seat_fare);
    } else if (sort === "seats") {
      rides.sort(
        (a, b) => b.available_seats - a.available_seats
      );
    }

    return res.status(200).json(rides);
  } catch (error) {
    console.error("Search rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search for rides",
    });
  }
}
export async function createRide(req, res) {
  try {
    const {
      source,
      destination,
      source_coords,
      dest_coords,
      departure_date,
      departure_time,
      total_seats,
      total_cost,
      vehicle_id,
      distance_km = 0,
      duration_min = 0,
      route = [],
      notes = "",
      publish = true,
    } = req.body;

    const seats = Number(total_seats);
    const totalCost = Number(total_cost);

    if (!source?.trim() || !destination?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Source and destination are required",
      });
    }

    if (source.trim() === destination.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Source and destination must be different",
      });
    }

    if (!departure_date || !departure_time) {
      return res.status(400).json({
        success: false,
        message: "Departure date and time are required",
      });
    }

    const departureDateTime = new Date(
      `${departure_date}T${departure_time}:00`
    );

    if (
      Number.isNaN(departureDateTime.getTime()) ||
      departureDateTime <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Departure date and time must be in the future",
      });
    }

    if (
      !Number.isInteger(seats) ||
      seats < 1 ||
      seats > 7
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Available seats must be between 1 and 7",
      });
    }

    if (
      !Number.isFinite(totalCost) ||
      totalCost <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Estimated total cost must be greater than zero",
      });
    }

    if (
      !source_coords ||
      !dest_coords ||
      !Number.isFinite(Number(source_coords.lat)) ||
      !Number.isFinite(Number(source_coords.lng)) ||
      !Number.isFinite(Number(dest_coords.lat)) ||
      !Number.isFinite(Number(dest_coords.lng))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid route coordinates are required",
      });
    }

    const [vehicleRows] = await pool.execute(
      `SELECT *
       FROM vehicles
       WHERE id = ?
         AND driver_id = ?
         AND is_active = TRUE
       LIMIT 1`,
      [vehicle_id, req.user.id]
    );

    const vehicle = vehicleRows[0];

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message:
          "The selected vehicle was not found",
      });
    }

    if (seats > Number(vehicle.total_seats)) {
      return res.status(400).json({
        success: false,
        message:
          "Available seats cannot exceed the vehicle capacity",
      });
    }

    if (publish) {
      const [verificationRows] =
        await pool.execute(
          `SELECT status
           FROM driver_verifications
           WHERE user_id = ?
           LIMIT 1`,
          [req.user.id]
        );

      if (
        verificationRows[0]?.status !== "approved"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your driver verification must be approved before publishing rides",
        });
      }
    }

    const status = publish ? "scheduled" : "draft";

    const mysqlDeparture = `${departure_date} ${departure_time}:00`;

    const [result] = await pool.execute(
      `INSERT INTO rides (
          driver_id,
          vehicle_id,
          source_address,
          source_latitude,
          source_longitude,
          destination_address,
          destination_latitude,
          destination_longitude,
          departure_datetime,
          total_seats,
          available_seats,
          estimated_total_cost,
          distance_km,
          estimated_duration_minutes,
          route_geometry,
          notes,
          status
       )
       VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?
       )`,
      [
        req.user.id,
        vehicle.id,
        source.trim(),
        Number(source_coords.lat),
        Number(source_coords.lng),
        destination.trim(),
        Number(dest_coords.lat),
        Number(dest_coords.lng),
        mysqlDeparture,
        seats,
        seats,
        totalCost,
        Number(distance_km) || 0,
        Number(duration_min) || 0,
        JSON.stringify(route),
        notes.trim(),
        status,
      ]
    );

    return res.status(201).json({
      id: String(result.insertId),
      driver_id: String(req.user.id),
      vehicle_id: String(vehicle.id),
      source: source.trim(),
      destination: destination.trim(),
      source_coords,
      dest_coords,
      departure_date,
      departure_time,
      total_seats: seats,
      available_seats: seats,
      total_cost: totalCost,
      distance_km: Number(distance_km) || 0,
      duration_min: Number(duration_min) || 0,
      status,
      stage: "starting_soon",
      driver_location: null,
      location_updated_at: null,
      notes: notes.trim(),
      route,
      driver: {
        id: String(req.user.id),
        full_name: req.user.full_name,
        email: req.user.email,
        phone: req.user.phone,
        role: "driver",
        status: req.user.account_status,
        avatar_url: req.user.avatar_url || "",
        rating: 0,
        total_trips: 0,
        created_at: req.user.created_at,
        updated_at: req.user.updated_at,
      },
      vehicle: {
        id: String(vehicle.id),
        driver_id: String(vehicle.driver_id),
        make: vehicle.make,
        model: vehicle.model,
        manufacturing_year: Number(
          vehicle.manufacturing_year
        ),
        number: vehicle.registration_number,
        color: vehicle.color,
        seats: vehicle.total_seats,
        registration_doc: "",
        created_at: vehicle.created_at,
      },
    });
  } catch (error) {
    console.error("Create ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create the ride",
    });
  }
}
export async function getRideById(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          r.*,

          DATE_FORMAT(
            r.departure_datetime,
            '%Y-%m-%d'
          ) AS departure_date,

          TIME_FORMAT(
            r.departure_datetime,
            '%H:%i:%s'
          ) AS departure_time,

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
          v.total_seats AS vehicle_seats,

          (
            SELECT COALESCE(
              SUM(b.seats_booked),
              0
            )
            FROM bookings b
            WHERE b.ride_id = r.id
              AND b.status = 'confirmed'
          ) AS confirmed_passengers

       FROM rides r

       INNER JOIN users d
         ON d.id = r.driver_id

       LEFT JOIN driver_verifications dv
         ON dv.user_id = r.driver_id

       LEFT JOIN vehicles v
         ON v.id = r.vehicle_id

       WHERE r.id = ?
       LIMIT 1`,
      [req.params.id]
    );

    const row = rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const isOwner =
      Number(row.driver_id) === Number(req.user.id);

    if (row.status === "draft" && !isOwner) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
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

    const confirmedPassengers =
      Number(row.confirmed_passengers) || 0;

    const perSeatFare = Math.round(
      Number(row.estimated_total_cost) /
        Math.max(1, confirmedPassengers + 1)
    );

    const frontendStatus =
      row.status === "in_progress"
        ? "active"
        : row.status;

    return res.status(200).json({
      id: String(row.id),
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

      status: frontendStatus,

      stage:
        row.status === "in_progress"
          ? "in_progress"
          : row.status === "completed"
            ? "completed"
            : "starting_soon",

      driver_location: null,
      location_updated_at: null,
      notes: row.notes || "",
      route,
      confirmed_passengers: confirmedPassengers,
      per_seat_fare: perSeatFare,
      created_at: row.created_at,
      updated_at: row.updated_at,

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
          row.verification_status === "approved",

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
    });
  } catch (error) {
    console.error("Get ride details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load ride details",
    });
  }
}
export async function getMyRides(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          r.*,

          DATE_FORMAT(
            r.departure_datetime,
            '%Y-%m-%d'
          ) AS departure_date,

          TIME_FORMAT(
            r.departure_datetime,
            '%H:%i:%s'
          ) AS departure_time,

          v.make AS vehicle_make,
          v.model AS vehicle_model,
          v.manufacturing_year,
          v.registration_number,
          v.color AS vehicle_color,
          v.total_seats AS vehicle_seats,

          (
            SELECT COALESCE(
              SUM(b.seats_booked),
              0
            )
            FROM bookings b
            WHERE b.ride_id = r.id
              AND b.status = 'confirmed'
          ) AS confirmed_passengers

       FROM rides r

       LEFT JOIN vehicles v
         ON v.id = r.vehicle_id

       WHERE r.driver_id = ?

       ORDER BY r.departure_datetime DESC`,
      [req.user.id]
    );

    const rides = rows.map((row) => {
      let route = [];

      try {
        route =
          typeof row.route_geometry === "string"
            ? JSON.parse(row.route_geometry)
            : row.route_geometry || [];
      } catch {
        route = [];
      }

      const confirmedPassengers =
        Number(row.confirmed_passengers) || 0;

      const perSeatFare = Math.round(
        Number(row.estimated_total_cost) /
          Math.max(1, confirmedPassengers + 1)
      );

      return {
        id: String(row.id),
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
          row.status === "in_progress"
            ? "active"
            : row.status,

        stage:
          row.status === "in_progress"
            ? "in_progress"
            : row.status === "completed"
              ? "completed"
              : "starting_soon",

        driver_location: null,
        location_updated_at: null,
        notes: row.notes || "",
        route,
        confirmed_passengers: confirmedPassengers,
        per_seat_fare: perSeatFare,
        created_at: row.created_at,
        updated_at: row.updated_at,

        driver: {
          id: String(req.user.id),
          full_name: req.user.full_name,
          email: req.user.email,
          phone: req.user.phone,
          role: "driver",
          status: req.user.account_status,
          avatar_url: req.user.avatar_url || "",
          rating: 0,
          total_trips: 0,
          verified: true,
          created_at: req.user.created_at,
          updated_at: req.user.updated_at,
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
      };
    });

    return res.status(200).json(rides);
  } catch (error) {
    console.error("Get my rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your rides",
    });
  }
}
export async function getFareQuote(req, res) {
  try {
    const requestedSeats = Number(
      req.query.seats || 1
    );

    if (
      !Number.isInteger(requestedSeats) ||
      requestedSeats < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid number of seats",
      });
    }

    const [rideRows] = await pool.execute(
      `SELECT
          id,
          estimated_total_cost,
          available_seats,
          status
       FROM rides
       WHERE id = ?
       LIMIT 1`,
      [req.params.id]
    );

    const ride = rideRows[0];

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    if (ride.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message:
          "This ride is not currently available for booking",
      });
    }

    if (
      requestedSeats >
      Number(ride.available_seats)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "The requested number of seats is not available",
      });
    }

    const [bookingRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM bookings
       WHERE ride_id = ?
         AND status = 'confirmed'`,
      [req.params.id]
    );

    const confirmedBookings =
      Number(bookingRows[0].total) || 0;

    const passengerCount =
      confirmedBookings + 1;

    const totalRideCost = Number(
      ride.estimated_total_cost
    );

    const perSeatFare = Math.round(
      totalRideCost /
        Math.max(1, passengerCount)
    );

    const baseFare =
      perSeatFare * requestedSeats;

    const [studentRows] = await pool.execute(
      `SELECT status
       FROM student_verifications
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    const discountEligible =
      studentRows[0]?.status === "approved";

    const discount = discountEligible
      ? Math.round(baseFare * 0.15)
      : 0;

    const finalFare = baseFare - discount;

    return res.status(200).json({
      totalCost: totalRideCost,
      confirmedPassengers: passengerCount,
      baseFare,
      discount,
      finalFare,
      discountEligible,
    });
  } catch (error) {
    console.error("Fare quote error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate the fare",
    });
  }
}
export async function updateRideStatus(req, res) {
  const connection = await pool.getConnection();

  try {
    const rideId = Number(req.params.id);
    const driverId = req.user.id;
    const { stage } = req.body;

    const allowedStages = [
      "driver_on_the_way",
      "ride_started",
      "in_progress",
      "arriving",
      "completed",
    ];

    if (!Number.isInteger(rideId) || rideId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    if (!allowedStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride status",
      });
    }

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id, driver_id, status
       FROM rides
       WHERE id = ?
       FOR UPDATE`,
      [rideId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const ride = rows[0];

    if (Number(ride.driver_id) !== Number(driverId)) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "You cannot update this ride",
      });
    }
    if (stage === "ride_started" && ride.status === "scheduled") {
  const [bookingRows] = await connection.execute(
    `SELECT COUNT(*) AS confirmed_count
     FROM bookings
     WHERE ride_id = ?
       AND status = 'confirmed'`,
    [rideId]
  );

  if (Number(bookingRows[0].confirmed_count) === 0) {
    await connection.rollback();

    return res.status(400).json({
      success: false,
      message:
        "You cannot start this ride until at least one passenger booking is confirmed",
    });
  }
}
    if (["cancelled", "completed"].includes(ride.status)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: `This ride is already ${ride.status}`,
      });
    }

    const newStatus =
      stage === "completed" ? "completed" : "in_progress";

    await connection.execute(
  `UPDATE rides
   SET status = ?,
       ride_stage = ?
   WHERE id = ?`,
  [newStatus, stage, rideId]
);

    if (newStatus === "completed") {
      await connection.execute(
        `UPDATE bookings
         SET status = 'completed'
         WHERE ride_id = ?
           AND status = 'confirmed'`,
        [rideId]
      );
    }
     if (stage === "ride_started" || stage === "completed") {
  const notificationType =
    stage === "completed"
      ? "ride_completed"
      : "ride_started";

  const notificationTitle =
    stage === "completed"
      ? "Ride completed"
      : "Ride started";

  const notificationMessage =
    stage === "completed"
      ? "Your UniRide trip has been completed."
      : "Your driver has started the ride. Open Active Ride to follow the trip.";

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
     SELECT
       b.passenger_id,
       b.ride_id,
       b.id,
       ?,
       ?,
       ?,
       JSON_OBJECT(
         'ride_id', b.ride_id,
         'booking_id', b.id,
         'stage', ?
       ),
       0
     FROM bookings b
     WHERE b.ride_id = ?
       AND b.status IN ('confirmed', 'completed')`,
    [
      notificationType,
      notificationTitle,
      notificationMessage,
      stage,
      rideId,
    ]
  );
}
    await connection.commit();

    return res.status(200).json({
      id: rideId,
      status: newStatus,
      stage,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update ride status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update ride status",
    });
  } finally {
    connection.release();
  }
}
export async function cancelRide(req, res) {
  const connection = await pool.getConnection();

  try {
    const driverId = Number(req.user.id);
    const rideId = Number(req.params.id);

    if (!Number.isInteger(rideId) || rideId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    await connection.beginTransaction();

    const [rideRows] = await connection.execute(
      `SELECT
          id,
          driver_id,
          status,
          source_address,
          destination_address
       FROM rides
       WHERE id = ?
       FOR UPDATE`,
      [rideId]
    );

    if (rideRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    const ride = rideRows[0];

    if (Number(ride.driver_id) !== driverId) {
      await connection.rollback();

      return res.status(403).json({
        success: false,
        message: "You cannot cancel another driver's ride",
      });
    }

    if (ride.status === "cancelled") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "This ride is already cancelled",
      });
    }

    if (ride.status === "completed") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "A completed ride cannot be cancelled",
      });
    }

    await connection.execute(
      `UPDATE rides
       SET status = 'cancelled',
           ride_stage = 'cancelled'
       WHERE id = ?`,
      [rideId]
    );

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
       SELECT
          b.passenger_id,
          b.ride_id,
          b.id,
          'ride_cancelled',
          'Ride cancelled',
          ?,
          JSON_OBJECT(
            'ride_id', b.ride_id,
            'booking_id', b.id,
            'status', 'cancelled'
          ),
          0
       FROM bookings b
       WHERE b.ride_id = ?
         AND b.status IN ('pending', 'confirmed')`,
      [
        `The ride from ${ride.source_address} to ${ride.destination_address} has been cancelled by the driver.`,
        rideId,
      ]
    );

    await connection.execute(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE ride_id = ?
         AND status IN ('pending', 'confirmed')`,
      [rideId]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Ride cancelled successfully",
      ride: {
        id: rideId,
        status: "cancelled",
        ride_stage: "cancelled",
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Cancel ride error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel the ride",
    });
  } finally {
    connection.release();
  }
}
export async function pushRideLocation(req, res) {
  try {
    const rideId = Number(req.params.id);
    const driverId = Number(req.user.id);

    const { lat, lng } = req.body;

    if (!Number.isInteger(rideId) || rideId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ride ID",
      });
    }

    if (
      !Number.isFinite(Number(lat)) ||
      !Number.isFinite(Number(lng))
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    const [rideRows] = await pool.execute(
      `SELECT id, driver_id, status
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

    if (Number(ride.driver_id) !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this ride location",
      });
    }

    if (ride.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Location can only be updated for an active ride",
      });
    }

    await pool.execute(
      `UPDATE rides
       SET current_latitude = ?,
           current_longitude = ?,
           location_updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [latitude, longitude, rideId]
    );

    emitToRide(rideId, "ride:location", {
      rideId: String(rideId),
      lat: latitude,
      lng: longitude,
      location_updated_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      ride_id: String(rideId),
      lat: latitude,
      lng: longitude,
      location_updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Push ride location error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update ride location",
    });
  }
}