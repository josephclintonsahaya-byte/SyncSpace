
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}));

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

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("SyncSpace server running on port 5000");
});
