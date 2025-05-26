require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://chat-frontend-three-beige.vercel.app",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: "https://chat-frontend-three-beige.vercel.app",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "Chat",
  password: process.env.DB_PASSWORD || "090904",
  port: process.env.DB_PORT || 5432,
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("message", async (message) => {
    try {
      const { content } = message;
      const result = await pool.query(
        "INSERT INTO messages (content) VALUES ($1) RETURNING *",
        [content]
      );
      io.emit("message", result.rows[0]);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Endpoint to fetch all messages
app.get("/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM messages ORDER BY created_at ASC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
