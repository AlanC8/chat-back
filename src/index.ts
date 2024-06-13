import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import globalRouter from "./global-router";
import { logger } from "./logger";
import connectDB from "./db";
import { authMiddleware } from "./middlewares/auth-middleware";
import User from "./auth/models/User";
import Message from "./models/message";
import { IMessage } from "./types/messageInterface";

const PORT = process.env.PORT || 3000;

const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

connectDB();

app.use(cors());
app.use(logger);
app.use(express.json());

app.use("/api/v1/", globalRouter);

io.on("connection", onConnected);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

interface requestUser {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

app.get("/user", authMiddleware, async (req, res) => {
  try {
    if (req.user) {
      const requestUser = req.user as requestUser;
      const user = await User.findById(requestUser.id);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

let socketsConnected = new Set();

async function onConnected(socket: Socket) {
  console.log("connected");
  console.log(socket.id);
  socketsConnected.add(socket.id);

  const existingMessages = await Message.find().sort("createdAt");
  socket.on("get-message", () => {
    socket.emit("init-message", existingMessages);
  });

  io.emit("clients-total", socketsConnected.size);

  socket.on("disconnect", () => {
    console.log("disconnected");
    socketsConnected.delete(socket.id);
    io.emit("clients-total", socketsConnected.size);
  });

  socket.on("send-message", async (data: IMessage) => {
    try {
      const newMessage = new Message(data);
      await newMessage.save();

      const messages = await Message.find();
      io.emit("chat-message", messages);  // Emit to all clients, not just the broadcasting socket
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("feedback", (data: string) => {
    console.log(data);
    if (data === "") {
      console.log("empty");
      socket.broadcast.emit("feedback-check", data);
    } else {
      console.log("not empty");
      socket.broadcast.emit("feedback-check", data);
    }
  });
}
