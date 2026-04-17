import express from "express";
import {
  getNotificationsForUser,
  markNotificationAsRead,
  checkTaskDeadlines,
  checkTodoDeadlines,
} from "../controller/notificationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-notification/:userId", authMiddleware, getNotificationsForUser);

router.patch("/read/:notificationId", authMiddleware, markNotificationAsRead);

router.get("/task-deadlines", authMiddleware, checkTaskDeadlines);
router.get("/todo-deadlines", authMiddleware, checkTodoDeadlines);

export default router;
