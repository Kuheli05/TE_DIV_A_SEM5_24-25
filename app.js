import express from "express";
import MongoStore from "connect-mongo";
import { connectDB } from "./db.js";
import fileUpload from "express-fileupload";
import cors from "cors";
import http from "http";
import errorHandler from "./middleware/error.js";

import userRouter from "./routers/userRoutes.js";
import taskRoutes from "./routers/taskRoutes.js";
import streakRoutes from "./routers/streakRoutes.js";
import todoRoutes from "./routers/todoRoutes.js";
import thoughtsRoutes from "./routers/thoughtsRoutes.js";
import timerRoutes from "./routers/timerRoutes.js";
import notificationRoutes from "./routers/notificationRoutes.js";
const port = 4000;
const app = express();
app.use(cors());

const server = http.createServer(app);
app.use(express.json());
connectDB();
app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use("/api/users", userRouter);
app.use("/api/task", taskRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/todo", todoRoutes);
app.use("/api/thoughts", thoughtsRoutes);
app.use("/api/timer", timerRoutes);
app.use("/api/notification", notificationRoutes);

app.use(errorHandler);

app.use(express.static("public"));

app.set("views", "views");
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.send(`OSCAR is very Cute`);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
