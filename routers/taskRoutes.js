import { Router } from "express";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getOverdueTasks,
  markTaskInProgress,
  getTasksByTag,
} from "../controller/taskController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/create", authMiddleware, createTask);
router.get("/get-all", authMiddleware, getTasks);
router.put("/update/:taskId", authMiddleware, updateTask);
router.delete("/delete/:taskId", authMiddleware, deleteTask);
router.get("/get-over-due", authMiddleware, getOverdueTasks);
router.put(
  "/mark-progress/:taskId",
  authMiddleware,
  markTaskInProgress
);
router.get("/get-task-bytag", authMiddleware, getTasksByTag);

export default router;
