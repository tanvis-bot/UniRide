import pool from "../config/db.js";

function frontendNotificationType(type) {
  if (type === "new_message") {
    return "chat_message";
  }

  if (type === "ride_started") {
    return "ride_starting";
  }

  return type;
}

function notificationLink(row, role) {
  if (
    row.type === "verification_approved" ||
    row.type === "verification_rejected"
  ) {
    return role === "driver"
      ? "/driver/verification"
      : "/passenger/student-verification";
  }

  if (row.type === "booking_request") {
    return "/driver/requests";
  }

  if (
    row.type === "booking_confirmed" ||
    row.type === "booking_rejected"
  ) {
    return "/passenger/bookings";
  }

  if (row.type === "ride_started") {
    return role === "driver"
      ? "/driver/active-ride"
      : "/passenger/active-ride";
  }

  if (
    row.type === "ride_completed" ||
    row.type === "ride_cancelled"
  ) {
    return role === "driver"
      ? "/driver/rides"
      : "/passenger/bookings";
  }

  if (row.type === "new_message") {
    return role === "driver"
      ? "/driver/messages"
      : "/passenger/messages";
  }

  if (row.type === "sos_alert") {
  return role === "admin"
    ? "/admin/issues"
    : role === "driver"
    ? "/driver/active-ride"
    : "/passenger/active-ride";
  }

  return role === "driver"
    ? "/driver/notifications"
    : "/passenger/notifications";
}

function mapNotification(row, role) {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    type: frontendNotificationType(row.type),
    title: row.title,
    body: row.message,
    link: notificationLink(row, role),
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
  };
}

export async function getMyNotifications(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
          id,
          user_id,
          ride_id,
          booking_id,
          type,
          title,
          message,
          is_read,
          read_at,
          created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    const notifications = rows.map((row) =>
      mapNotification(row, req.user.role)
    );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const [result] = await pool.execute(
      `UPDATE notifications
       SET is_read = TRUE,
           read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const [rows] = await pool.execute(
      `SELECT
          id,
          user_id,
          ride_id,
          booking_id,
          type,
          title,
          message,
          is_read,
          read_at,
          created_at
       FROM notifications
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [req.params.id, req.user.id]
    );

    return res
      .status(200)
      .json(mapNotification(rows[0], req.user.role));
  } catch (error) {
    console.error("Mark notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the notification",
    });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await pool.execute(
      `UPDATE notifications
       SET is_read = TRUE,
           read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE user_id = ? AND is_read = FALSE`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update notifications",
    });
  }
}