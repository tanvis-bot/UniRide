import pool from "../config/db.js";

export async function getAdminStats(req, res) {
  try {
    const [totalRows] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'passenger') AS passengers,
        (SELECT COUNT(*) FROM users WHERE role = 'driver') AS drivers,

        (
          SELECT COUNT(DISTINCT user_id)
          FROM driver_verifications
          WHERE status = 'approved'
        ) AS verifiedDrivers,

        (
          SELECT COUNT(DISTINCT user_id)
          FROM student_verifications
          WHERE status = 'approved'
        ) AS verifiedStudents,

        (
          (SELECT COUNT(*) FROM driver_verifications WHERE status = 'pending')
          +
          (SELECT COUNT(*) FROM student_verifications WHERE status = 'pending')
        ) AS pendingVerifications,

        (SELECT COUNT(*) FROM rides) AS rides,

        (
          SELECT COUNT(*)
          FROM rides
          WHERE status = 'in_progress'
        ) AS activeRides,

        (
          SELECT COUNT(*)
          FROM rides
          WHERE status = 'completed'
        ) AS completedRides,

        (SELECT COUNT(*) FROM bookings) AS bookings,
        (SELECT COUNT(*) FROM reported_issues) AS openIssues,
        (SELECT COUNT(*) FROM sos_incidents) AS sosIncidents
    `);

    const [activityRows] = await pool.execute(`
      SELECT
        DATE_FORMAT(activity_date, '%d %b') AS day,
        SUM(rides) AS rides,
        SUM(bookings) AS bookings
      FROM (
        SELECT
          DATE(created_at) AS activity_date,
          COUNT(*) AS rides,
          0 AS bookings
        FROM rides
        WHERE created_at >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(created_at)

        UNION ALL

        SELECT
          DATE(created_at) AS activity_date,
          0 AS rides,
          COUNT(*) AS bookings
        FROM bookings
        WHERE created_at >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(created_at)
      ) activity
      GROUP BY activity_date
      ORDER BY activity_date
    `);

    const [rideStatusRows] = await pool.execute(`
      SELECT
        status AS name,
        COUNT(*) AS value
      FROM rides
      GROUP BY status
      ORDER BY status
    `);

    const totals = {};

    for (const [key, value] of Object.entries(totalRows[0])) {
      totals[key] = Number(value);
    }

    const activity = activityRows.map((row) => ({
      day: row.day,
      rides: Number(row.rides),
      bookings: Number(row.bookings),
    }));

    const rideMix = rideStatusRows.map((row) => ({
      name: row.name,
      value: Number(row.value),
    }));

    return res.status(200).json({
      totals,
      activity,
      rideMix,
    });
  } catch (error) {
    console.error("Admin statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin statistics",
    });
  }
}
export async function getAdminUsers(req, res) {
  try {
    const {
      q = "",
      role = "all",
      status = "all",
    } = req.query;

    const conditions = [];
    const values = [];

    if (q.trim()) {
      conditions.push("(u.full_name LIKE ? OR u.email LIKE ?)");
      const search = `%${q.trim()}%`;
      values.push(search, search);
    }

    if (role !== "all") {
      conditions.push("u.role = ?");
      values.push(role);
    }

    if (status !== "all") {
      conditions.push("u.account_status = ?");
      values.push(status);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await pool.execute(
      `SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.account_status AS status,
        u.avatar_url,
        u.created_at,
        u.updated_at,

        EXISTS(
          SELECT 1
          FROM student_verifications sv
          WHERE sv.user_id = u.id
            AND sv.status = 'approved'
        ) AS student_verified,

        EXISTS(
          SELECT 1
          FROM driver_verifications dv
          WHERE dv.user_id = u.id
            AND dv.status = 'approved'
        ) AS driver_verified,

        (
          SELECT COUNT(*)
          FROM vehicles v
          WHERE v.driver_id = u.id
        ) AS vehicles

       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC`,
      values
    );

    const users = rows.map((user) => ({
      ...user,
      id: String(user.id),
      student_verified: Boolean(user.student_verified),
      driver_verified: Boolean(user.driver_verified),
      vehicles: Number(user.vehicles),
    }));

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users",
    });
  }
}
export async function getAdminVerifications(req, res) {
  try {
    const type = req.query.type;
    const status = req.query.status || "pending";

    if (!["driver", "student"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Verification type must be driver or student",
      });
    }

    const statusCondition =
      status === "all" ? "" : "AND verification.status = ?";

    const values = status === "all" ? [] : [status];

    if (type === "driver") {
      const [rows] = await pool.execute(
        `SELECT
          verification.id,
          verification.user_id,
          verification.licence_number,
          verification.licence_document_url,
          verification.government_id_type,
          verification.government_id_number,
          verification.government_id_url,
          verification.status,
          verification.admin_remarks,
          verification.reviewed_at,
          verification.created_at,
          verification.updated_at,

          u.full_name,
          u.email,
          u.phone,
          u.account_status,
          u.avatar_url,
          u.created_at AS user_created_at,
          u.updated_at AS user_updated_at

         FROM driver_verifications verification
         INNER JOIN users u ON u.id = verification.user_id

         WHERE 1 = 1
         ${statusCondition}

         ORDER BY verification.created_at DESC`,
        values
      );

      const userIds = rows.map((row) => row.user_id);

      let vehicleRows = [];

      if (userIds.length > 0) {
        const placeholders = userIds.map(() => "?").join(",");

        const [vehicles] = await pool.execute(
          `SELECT *
           FROM vehicles
           WHERE driver_id IN (${placeholders})`,
          userIds
        );

        vehicleRows = vehicles;
      }

      const result = rows.map((row) => ({
        type: "driver",

        user: {
          id: String(row.user_id),
          full_name: row.full_name,
          email: row.email,
          phone: row.phone,
          role: "driver",
          status: row.account_status,
          avatar_url: row.avatar_url || "",
          rating: 0,
          total_trips: 0,
          created_at: row.user_created_at,
          updated_at: row.user_updated_at,
        },

        record: {
          id: String(row.id),
          user_id: String(row.user_id),
          licence_number: row.licence_number,
          licence_doc: row.licence_document_url,
          gov_id_type: row.government_id_type,
          gov_id_number: row.government_id_number,
          gov_id_doc: row.government_id_url,
          status: row.status,
          remarks: row.admin_remarks,
          submitted_at: row.created_at,
          reviewed_at: row.reviewed_at,
        },

        vehicles: vehicleRows
          .filter(
            (vehicle) =>
              Number(vehicle.driver_id) === Number(row.user_id)
          )
          .map((vehicle) => ({
            id: String(vehicle.id),
            driver_id: String(vehicle.driver_id),
            make: vehicle.make,
            model: vehicle.model,
            number: vehicle.registration_number,
            color: vehicle.color,
            seats: vehicle.total_seats,
            registration_doc:
              vehicle.registration_document_url ||
              vehicle.registration_doc ||
              "",
            created_at: vehicle.created_at,
          })),
      }));

      return res.status(200).json(result);
    }

    const [rows] = await pool.execute(
      `SELECT
        verification.id,
        verification.user_id,
        verification.college_name,
        verification.enrollment_number,
        verification.college_id_url,
        verification.status,
        verification.admin_remarks,
        verification.reviewed_at,
        verification.created_at,
        verification.updated_at,

        u.full_name,
        u.email,
        u.phone,
        u.account_status,
        u.avatar_url,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at

       FROM student_verifications verification
       INNER JOIN users u ON u.id = verification.user_id

       WHERE 1 = 1
       ${statusCondition}

       ORDER BY verification.created_at DESC`,
      values
    );

    const result = rows.map((row) => ({
      type: "student",

      user: {
        id: String(row.user_id),
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        role: "passenger",
        status: row.account_status,
        avatar_url: row.avatar_url || "",
        rating: 0,
        total_trips: 0,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      },

      record: {
        id: String(row.id),
        user_id: String(row.user_id),
        college_name: row.college_name,
        enrollment_no: row.enrollment_number,
        document_name: row.college_id_url
          ? row.college_id_url.split("/").pop()
          : "College ID",
        document_url: row.college_id_url,
        status: row.status,
        remarks: row.admin_remarks,
        submitted_at: row.created_at,
        reviewed_at: row.reviewed_at,
      },

      vehicles: [],
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get admin verifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load verification queue",
    });
  }
}
export async function reviewVerification(req, res) {
  const connection = await pool.getConnection();

  try {
    const verificationId = Number(req.params.id);
    const adminId = req.user.id;
    const { type, decision, remarks = "" } = req.body;

    if (!Number.isInteger(verificationId) || verificationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification ID",
      });
    }

    if (!["driver", "student"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Verification type must be driver or student",
      });
    }

    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be approve or reject",
      });
    }

    if (decision === "reject" && !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for rejection",
      });
    }

    const tableName =
      type === "driver"
        ? "driver_verifications"
        : "student_verifications";

    const newStatus =
      decision === "approve" ? "approved" : "rejected";

    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id, user_id, status
       FROM ${tableName}
       WHERE id = ?
       FOR UPDATE`,
      [verificationId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Verification record not found",
      });
    }

    await connection.execute(
      `UPDATE ${tableName}
       SET status = ?,
           admin_remarks = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE id = ?`,
      [
        newStatus,
        remarks.trim() || "Documents verified.",
        adminId,
        verificationId,
      ]
    );

    const notificationType =
  newStatus === "approved"
    ? "verification_approved"
    : "verification_rejected";

const notificationTitle =
  type === "driver"
    ? `Driver verification ${newStatus}`
    : `Student verification ${newStatus}`;

const notificationMessage =
  newStatus === "approved"
    ? type === "driver"
      ? "Your driver documents have been approved. You can now publish rides."
      : "Your student ID has been approved. Your student discount is now active."
    : remarks.trim() ||
      "Your verification was rejected. Please review the remarks and submit again.";

await connection.execute(
  `INSERT INTO notifications
    (
      user_id,
      type,
      title,
      message,
      data_json,
      is_read
    )
   VALUES (?, ?, ?, ?, ?, 0)`,
  [
    rows[0].user_id,
    notificationType,
    notificationTitle,
    notificationMessage,
    JSON.stringify({
      verification_id: verificationId,
      verification_type: type,
      status: newStatus,
    }),
  ]
);
    await connection.commit();

    return res.status(200).json({
      id: String(verificationId),
      user_id: String(rows[0].user_id),
      type,
      status: newStatus,
      remarks: remarks.trim() || "Documents verified.",
      reviewed_at: new Date().toISOString(),
    });
  } catch (error) {
    await connection.rollback();

    console.error("Review verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to review verification",
    });
  } finally {
    connection.release();
  }
}
export async function updateUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "active",
      "suspended",
      "deactivated",
    ];

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status",
      });
    }

    if (Number(userId) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own admin account status",
      });
    }

    const [result] = await pool.execute(
      `UPDATE users
       SET account_status = ?,
           token_version =
             CASE
               WHEN ? = 'active' THEN token_version
               ELSE token_version + 1
             END
       WHERE id = ?
         AND role != 'admin'`,
      [status, status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found or admin accounts cannot be changed",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
         id,
         full_name,
         email,
         phone,
         role,
         account_status AS status,
         avatar_url,
         created_at,
         updated_at
       FROM users
       WHERE id = ?`,
      [userId]
    );

    return res.status(200).json({
      ...rows[0],
      id: String(rows[0].id),
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user status",
    });
  }
}
export async function getAdminRides(req, res) {
  try {
    const {
      q = "",
      status = "all",
      date = "",
    } = req.query;

    const conditions = [];
    const values = [];

    if (q.trim()) {
      conditions.push(
        `(r.source_address LIKE ?
          OR r.destination_address LIKE ?
          OR u.full_name LIKE ?)`
      );

      const search = `%${q.trim()}%`;
      values.push(search, search, search);
    }

    if (status !== "all") {
      conditions.push("r.status = ?");
      values.push(status === "active" ? "in_progress" : status);
    }

    if (date) {
      conditions.push("DATE(r.departure_datetime) = ?");
      values.push(date);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await pool.execute(
      `SELECT
        r.*,

        DATE_FORMAT(r.departure_datetime, '%Y-%m-%d')
          AS departure_date,

        TIME_FORMAT(r.departure_datetime, '%H:%i:%s')
          AS departure_time,

        u.full_name AS driver_name,
        u.email AS driver_email,
        u.phone AS driver_phone,
        u.avatar_url AS driver_avatar,

        v.make AS vehicle_make,
        v.model AS vehicle_model,
        v.registration_number,
        v.color AS vehicle_color,
        v.total_seats AS vehicle_capacity,

        (
          SELECT COALESCE(SUM(b.seats_booked), 0)
          FROM bookings b
          WHERE b.ride_id = r.id
            AND b.status IN ('confirmed', 'completed')
        ) AS confirmed_passengers

       FROM rides r

       INNER JOIN users u
         ON u.id = r.driver_id

       LEFT JOIN vehicles v
         ON v.id = r.vehicle_id

       ${whereClause}

       ORDER BY r.departure_datetime DESC`,
      values
    );

    const rides = rows.map((row) => ({
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

      total_seats: Number(row.total_seats),
      available_seats: Number(row.available_seats),
      total_cost: Number(row.estimated_total_cost),

      distance_km: Number(row.distance_km || 0),
      duration_min: Number(
        row.estimated_duration_minutes || 0
      ),

      status:
        row.status === "in_progress"
          ? "active"
          : row.status,

      stage: row.ride_stage || "starting_soon",
      notes: row.notes || "",
      route: [],

      confirmed_passengers: Number(
        row.confirmed_passengers || 0
      ),

      driver_location: null,
      location_updated_at: null,
      created_at: row.created_at,
      updated_at: row.updated_at,

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

      vehicle: row.vehicle_id
        ? {
            id: String(row.vehicle_id),
            driver_id: String(row.driver_id),
            make: row.vehicle_make,
            model: row.vehicle_model,
            number: row.registration_number,
            color: row.vehicle_color,
            seats: Number(row.vehicle_capacity),
            registration_doc: "",
            created_at: "",
          }
        : null,
    }));

    return res.status(200).json(rides);
  } catch (error) {
    console.error("Get admin rides error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load rides",
    });
  }
}
export async function getAdminBookings(req, res) {
  try {
    const status = req.query.status || "all";

    const conditions = [];
    const values = [];

    if (status !== "all") {
      conditions.push("b.status = ?");
      values.push(status);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [rows] = await pool.execute(
      `SELECT
        b.id,
        b.ride_id,
        b.passenger_id,
        b.seats_booked,
        b.base_fare,
        b.student_discount_percent,
        b.final_fare,
        b.status,
        b.created_at,
        b.updated_at,

        r.source_address,
        r.destination_address,

        passenger.full_name AS passenger_name,
        passenger.email AS passenger_email,
        passenger.phone AS passenger_phone,

        driver.id AS driver_id,
        driver.full_name AS driver_name,
        driver.email AS driver_email,
        driver.phone AS driver_phone

       FROM bookings b

       INNER JOIN rides r
         ON r.id = b.ride_id

       INNER JOIN users passenger
         ON passenger.id = b.passenger_id

       INNER JOIN users driver
         ON driver.id = r.driver_id

       ${whereClause}

       ORDER BY b.created_at DESC`,
      values
    );

    const bookings = rows.map((row) => ({
      id: String(row.id),
      ride_id: String(row.ride_id),
      route: `${row.source_address} → ${row.destination_address}`,
      seats_booked: Number(row.seats_booked),
      base_fare: Number(row.base_fare),
      student_discount_percent: Number(
        row.student_discount_percent
      ),
      final_fare: Number(row.final_fare),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,

      passenger: {
        id: String(row.passenger_id),
        full_name: row.passenger_name,
        email: row.passenger_email,
        phone: row.passenger_phone,
        role: "passenger",
      },

      driver: {
        id: String(row.driver_id),
        full_name: row.driver_name,
        email: row.driver_email,
        phone: row.driver_phone,
        role: "driver",
      },
    }));

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Get admin bookings error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load bookings",
    });
  }
}

export async function getAdminIssues(req, res) {
  try {
    const [issueRows] = await pool.execute(
      `SELECT
          ri.id,
          ri.category,
          ri.description,
          ri.status,
          ri.created_at,
          u.id AS user_id,
          u.full_name AS user_name
       FROM reported_issues ri
       INNER JOIN users u
         ON u.id = ri.reported_by
       ORDER BY ri.created_at DESC
       LIMIT 100`
    );

    const [sosRows] = await pool.execute(
      `SELECT
          s.id,
          s.user_id,
          s.ride_id,
          s.latitude,
          s.longitude,
          s.status,
          s.created_at,
          u.full_name AS user_name
       FROM sos_incidents s
       INNER JOIN users u
         ON u.id = s.user_id
       ORDER BY s.created_at DESC
       LIMIT 100`
    );

    return res.status(200).json({
      issues: issueRows.map((row) => ({
        id: String(row.id),
        category: row.category,
        description: row.description,
        status: row.status,
        created_at: row.created_at,
        user: {
          id: String(row.user_id),
          full_name: row.user_name,
        },
      })),

      sos: sosRows.map((row) => ({
        id: String(row.id),
        user_id: String(row.user_id),
        ride_id:
          row.ride_id === null
            ? null
            : String(row.ride_id),

        location:
          row.latitude !== null &&
          row.longitude !== null
            ? {
                lat: Number(row.latitude),
                lng: Number(row.longitude),
              }
            : null,

        status: row.status,
        created_at: row.created_at,

        user: {
          id: String(row.user_id),
          full_name: row.user_name,
        },
      })),
    });
  } catch (error) {
    console.error("Get admin issues error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load issues and SOS incidents",
    });
  }
}