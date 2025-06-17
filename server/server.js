import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import db from "./config/db.js"; // Ensure your DB connection file is imported

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.routes.js";
import bookRoutes from "./routes/book.routes.js";
import exchangeRoutes from "./routes/exchange.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationsRoutes from "./routes/notifications.js";

// Initialize express app
const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/exchanges", exchangeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationsRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("Book Exchange API is running");
});

// ---------------- SOCKET.IO LOGIC ---------------- //

const onlineUsers = new Map(); // Track online users
app.set('io', io);
app.set('onlineUsers', onlineUsers);

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("A user connected:", socket.id, "User ID:", userId);

  if (userId) {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
  }

  // Join a specific exchange chat room
  socket.on("join_room", (exchangeId) => {
    socket.join(`exchange_${exchangeId}`);
    console.log(`User ${socket.id} joined room: exchange_${exchangeId}`);
  });

  // Real-time message handling
  socket.on("send_message", (messageData) => {
    io.to(`exchange_${messageData.exchangeId}`).emit(
      "receive_message",
      messageData
    );
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  });
});

// -------------------------------------------------- //

// 📌 Use this function anywhere (e.g. after an exchange request is saved)
export const sendRealTimeNotification = async ({
  toUserId,
  fromUserId,
  bookId,
  message,
}) => {
  // Insert into notifications table
  const [result] = await db.execute(
    "INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)",
    [toUserId, message, 'unread']
  );

  // Get the inserted notification's full data
  const [savedRows] = await db.execute(
    "SELECT * FROM notifications WHERE id = ?",
    [result.insertId]
  );

  const savedNotification = savedRows[0]; // full object including id, created_at, etc.

  const recipientSocketId = onlineUsers.get(toUserId.toString());

  if (recipientSocketId) {
    io.to(recipientSocketId).emit("newNotification", savedNotification);
    console.log(`Real-time notification sent to user ${toUserId}`);
  } else {
    console.log(`User ${toUserId} is offline; notification saved to DB`);
  }
};


// -------------------------------------------------- //

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
