import { Router } from "express";
import { getStreak, updateStreak, resetStreak } from "../controller/streakController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/get-streak", authMiddleware, getStreak);
router.put("/update", authMiddleware, updateStreak);
router.post("/reset", authMiddleware, resetStreak);

export default router;
