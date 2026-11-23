
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./db");

const { Whiteboard } = require("./models/Whiteboard");


const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173"
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to SyncSpace Backend!");
});

app.get("/api/about", (req, res) => {
  res.json({
    project: "SyncSpace",
    developer: "Joseph",
    version: "1.0.0"
  });
});

app.post("/api/whiteboards", async (req, res) => {
  try {
    const { roomId, drawings } = req.body;

    const board = await Whiteboard.findOneAndUpdate(
      { roomId },
      { drawings },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Whiteboard saved successfully",
      board,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save whiteboard",
      error: error.message,
    });
  }
});

app.get("/api/whiteboards/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    const board = await Whiteboard.findOne({ roomId });

    if (!board) {
      return res.status(404).json({
        message: "Whiteboard not found",
      });
    }

    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load whiteboard",
      error: error.message,
    });
  }
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Chat synchronization
  socket.on("chatMessage", (message) => {
    console.log("Message received:", message);
    socket.broadcast.emit("chatMessage", message);
  });

  // Drawing synchronization
  socket.on("drawing", (line) => {
    socket.broadcast.emit("drawing", line);
  });

  // Clear canvas synchronization
  socket.on("clearCanvas", () => {
    socket.broadcast.emit("clearCanvas");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const startServer = async () => {
  try {
    await connectDB();

    server.listen(5000, () => {
      console.log("SyncSpace server running on port 5000");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();
