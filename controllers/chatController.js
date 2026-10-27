import pool from "../config/db.js";
import { emitToUser } from "../utils/socket.js";

/**
 * Check whether a user is allowed to chat on a ride.
 * A driver can chat with passengers of their ride.
 * A passenger can chat only if their booking is confirmed/completed.
 */
async function verifyRideParticipant(rideId, userId) {
  const [rideRows] = await pool.execute(
    `SELECT
        id,
        driver_id,
        source_address,
        destination_address,
        departure_datetime,
        status
     FROM rides
     WHERE id = ?
     LIMIT 1`,
    [rideId]
  );

  if (rideRows.length === 0) {
    const error = new Error("Ride not found");
    error.status = 404;
    throw error;
  }

  const ride = rideRows[0];

  // Driver belongs to the ride
  if (String(ride.driver_id) === String(userId)) {
    return ride;
  }

  // Passenger must have a confirmed/completed booking
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
    const error = new Error(
      "Chat is only available to people with a confirmed booking on this ride"
    );
    error.status = 403;
    throw error;
  }

  return ride;
}

/**
 * Check that another user is also a participant of the ride.
 */
async function verifyOtherParticipant(rideId, userId) {
  const [rideRows] = await pool.execute(
    `SELECT driver_id
     FROM rides
     WHERE id = ?
     LIMIT 1`,
    [rideId]
  );

  if (rideRows.length === 0) {
    const error = new Error("Ride not found");
    error.status = 404;
    throw error;
  }

  const ride = rideRows[0];

  // Other user is the driver
  if (String(ride.driver_id) === String(userId)) {
    return true;
  }

  // Other user is a confirmed passenger
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
    const error = new Error(
      "The selected user is not a participant of this ride"
    );
    error.status = 403;
    throw error;
  }

  return true;
}

/**
 * GET /api/chat/threads
 *
 * Returns all conversations available to the logged-in user.
 */
export async function getChatThreads(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let rides = [];

    if (role === "driver") {
      // All rides created by this driver that have confirmed passengers
      const [rows] = await pool.execute(
        `SELECT DISTINCT
            r.id,
            r.source_address,
            r.destination_address,
            r.departure_datetime,
            r.status
         FROM rides r
         INNER JOIN bookings b
           ON b.ride_id = r.id
         WHERE r.driver_id = ?
           AND b.status IN ('confirmed', 'completed')
         ORDER BY r.departure_datetime DESC`,
        [userId]
      );

      rides = rows;
    } else {
      // Passenger's confirmed/completed rides
      const [rows] = await pool.execute(
        `SELECT DISTINCT
            r.id,
            r.source_address,
            r.destination_address,
            r.departure_datetime,
            r.status,
            r.driver_id
         FROM rides r
         INNER JOIN bookings b
           ON b.ride_id = r.id
         WHERE b.passenger_id = ?
           AND b.status IN ('confirmed', 'completed')
         ORDER BY r.departure_datetime DESC`,
        [userId]
      );

      rides = rows;
    }

    const threads = [];

    for (const ride of rides) {
      let participantIds = [];

      if (role === "driver") {
        const [passengers] = await pool.execute(
          `SELECT DISTINCT passenger_id
           FROM bookings
           WHERE ride_id = ?
             AND status IN ('confirmed', 'completed')`,
          [ride.id]
        );

        participantIds = passengers.map((row) => row.passenger_id);
      } else {
        participantIds = [ride.driver_id];
      }

      for (const participantId of participantIds) {
        const [messages] = await pool.execute(
          `SELECT
              id,
              ride_id,
              sender_id,
              receiver_id,
              message,
              is_read,
              created_at
           FROM chat_messages
           WHERE ride_id = ?
             AND (
               (sender_id = ? AND receiver_id = ?)
               OR
               (sender_id = ? AND receiver_id = ?)
             )
           ORDER BY created_at ASC`,
          [
            ride.id,
            userId,
            participantId,
            participantId,
            userId,
          ]
        );

        const [userRows] = await pool.execute(
          `SELECT
              id,
              full_name,
              email,
              phone,
              role,
              account_status,
              avatar_url,
              created_at,
              updated_at
           FROM users
           WHERE id = ?
           LIMIT 1`,
          [participantId]
        );

        if (userRows.length === 0) continue;

        const participant = userRows[0];

        const unread = messages.filter(
          (message) =>
            String(message.receiver_id) === String(userId) &&
            !Boolean(message.is_read)
        ).length;

        const lastMessage =
          messages.length > 0
            ? messages[messages.length - 1]
            : null;

        threads.push({
          ride_id: String(ride.id),

          route: `${ride.source_address} → ${ride.destination_address}`,

          ride_status: ride.status,

          departure: ride.departure_datetime,

          participant: {
            id: String(participant.id),
            full_name: participant.full_name,
            email: participant.email,
            phone: participant.phone,
            role: participant.role,
            status: participant.account_status,
            avatar_url: participant.avatar_url || "",
            rating: 0,
            total_trips: 0,
            created_at: participant.created_at,
            updated_at: participant.updated_at,
          },

          online: ride.status === "in_progress",

          unread,

          last_message: lastMessage
            ? {
                id: String(lastMessage.id),
                ride_id: String(lastMessage.ride_id),
                sender_id: String(lastMessage.sender_id),
                receiver_id: String(lastMessage.receiver_id),
                body: lastMessage.message,
                is_read: Boolean(lastMessage.is_read),
                created_at: lastMessage.created_at,
              }
            : null,
        });
      }
    }

    threads.sort((a, b) => {
      const aTime = a.last_message?.created_at || "";
      const bTime = b.last_message?.created_at || "";

      return bTime.localeCompare(aTime);
    });

    return res.status(200).json(threads);
  } catch (error) {
    console.error("Get chat threads error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to load chat threads",
    });
  }
}

/**
 * GET /api/chat/:rideId/:userId
 *
 * Get messages between logged-in user and another participant.
 */
export async function getChatMessages(req, res) {
  try {
    const currentUserId = req.user.id;
    const { rideId, userId: otherUserId } = req.params;

    await verifyRideParticipant(rideId, currentUserId);
    await verifyOtherParticipant(rideId, otherUserId);

    const [rows] = await pool.execute(
      `SELECT
          id,
          ride_id,
          sender_id,
          receiver_id,
          message,
          is_read,
          created_at
       FROM chat_messages
       WHERE ride_id = ?
         AND (
           (sender_id = ? AND receiver_id = ?)
           OR
           (sender_id = ? AND receiver_id = ?)
         )
       ORDER BY created_at ASC`,
      [
        rideId,
        currentUserId,
        otherUserId,
        otherUserId,
        currentUserId,
      ]
    );

    // Mark received messages as read
    await pool.execute(
      `UPDATE chat_messages
       SET
         is_read = 1,
         read_at = CURRENT_TIMESTAMP
       WHERE ride_id = ?
         AND receiver_id = ?
         AND sender_id = ?
         AND is_read = 0`,
      [
        rideId,
        currentUserId,
        otherUserId,
      ]
    );

    const messages = rows.map((row) => ({
      id: String(row.id),
      ride_id: String(row.ride_id),
      sender_id: String(row.sender_id),
      receiver_id: String(row.receiver_id),
      body: row.message,
      is_read:
        String(row.receiver_id) === String(currentUserId)
          ? true
          : Boolean(row.is_read),
      created_at: row.created_at,
    }));

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get chat messages error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to load messages",
    });
  }
}

/**
 * POST /api/chat/:rideId
 *
 * Send a message to another participant.
 */
export async function sendChatMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { rideId } = req.params;
    const { receiver_id, body } = req.body;

    if (!receiver_id) {
      return res.status(400).json({
        success: false,
        message: "Receiver is required",
      });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: "Type a message first",
      });
    }

    await verifyRideParticipant(rideId, senderId);
    await verifyOtherParticipant(rideId, receiver_id);

    const [result] = await pool.execute(
      `INSERT INTO chat_messages (
          ride_id,
          sender_id,
          receiver_id,
          message
       )
       VALUES (?, ?, ?, ?)`,
      [
        rideId,
        senderId,
        receiver_id,
        body.trim(),
      ]
    );

    // Notify the receiver
    await pool.execute(
      `INSERT INTO notifications (
          user_id,
          ride_id,
          type,
          title,
          message
       )
       VALUES (
          ?,
          ?,
          'new_message',
          'New message',
          ?
       )`,
      [
        receiver_id,
        rideId,
        body.trim(),
      ]
    );

    const [messageRows] = await pool.execute(
      `SELECT
          id,
          ride_id,
          sender_id,
          receiver_id,
          message,
          is_read,
          created_at
       FROM chat_messages
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const message = messageRows[0];

    const messagePayload = {
      id: String(message.id),
      ride_id: String(message.ride_id),
      sender_id: String(message.sender_id),
      receiver_id: String(message.receiver_id),
      body: message.message,
      is_read: Boolean(message.is_read),
      created_at: message.created_at,
    };

// Send the new message to the receiver in real time
emitToUser(receiver_id, "chat:message", messagePayload);

return res.status(201).json(messagePayload);
  } catch (error) {
    console.error("Send chat message error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Unable to send message",
    });
  }
}