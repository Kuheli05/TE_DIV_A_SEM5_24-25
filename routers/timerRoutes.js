import express from 'express';
import {
  createTimer,
  getTimers,
  getTimersOfDay,
  getTimerById,
  getTimerDurationOfDay,
  predictBestTime
} from '../controller/timerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createTimer);
router.get('/get-all', authMiddleware, getTimers);
router.get('/get/:date', authMiddleware, getTimersOfDay);
router.get('/get/:id', authMiddleware, getTimerById);
router.get('/duration/:date', authMiddleware, getTimerDurationOfDay);
router.post('/predict', authMiddleware, predictBestTime);

export default router;
