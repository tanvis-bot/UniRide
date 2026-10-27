import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { createServer } from "http";
import { Server } from "socket.io";

import { testDatabaseConnection } from "./config/db.js";
import { setSocketIO } from "./utils/socket.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import tripShareRoutes from "./routes/tripShareRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5001;

/* ---------------- CORS ---------------- */

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);

/* ---------------- Socket.IO ---------------- */

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  },
});

setSocketIO(io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join:user", ({ userId }) => {
    if (!userId) return;

    socket.join(`user:${userId}`);

    console.log(
      `Socket ${socket.id} joined user:${userId}`
    );
  });

  socket.on("join:room", (room) => {
    if (!room || typeof room !== "string") return;

    socket.join(room);

    console.log(
      `Socket ${socket.id} joined ${room}`
    );
  });

  socket.on("leave:room", (room) => {
    if (!room || typeof room !== "string") return;

    socket.leave(room);

    console.log(
      `Socket ${socket.id} left ${room}`
    );
  });

  socket.on("disconnect", () => {
    console.log(
      `Socket disconnected: ${socket.id}`
    );
  });
});

/* ---------------- Express middleware ---------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(cookieParser());

/* ---------------- Health routes ---------------- */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UniRide backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "UniRide API is healthy",
  });
});

/* ---------------- API routes ---------------- */

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/trip-shares", tripShareRoutes);

app.use("/api", sosRoutes);

/* ---------------- 404 handler ---------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* ---------------- Error handler ---------------- */

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each document must be 5 MB or smaller",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    "Only JPG, PNG and PDF documents are allowed"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  console.error(
    "Unhandled server error:",
    error
  );

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

/* ---------------- Start server ---------------- */

async function startServer() {
  try {
    await testDatabaseConnection();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`UniRide backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error(
      "Failed to connect to MySQL:"
    );

    console.error(error.message);

    process.exit(1);
  }
}

startServer();