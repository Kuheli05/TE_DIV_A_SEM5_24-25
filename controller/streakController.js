import Streak from '../models/StreakModel.js';
import Task from '../models/TaskModel.js';

const getStreak = async (req, res, next) => {
  try {
    const streak = await Streak.findOne({ userId: req.userId });
    if (!streak) {
      return res.status(200).json({ streakCount: 0 });
    }
    res.status(200).json(streak);
  } catch (error) {
    next(error);
  }
};

const updateStreak = async (req, res, next) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.completed) {
      return res.status(400).json({ message: 'Task already completed' });
    }

    task.completed = true;
    await task.save();

    let streak = await Streak.findOne({ userId: req.userId });
    const today = new Date();

    if (!streak) {
      streak = new Streak({
        userId: req.userId,
        completedDates: [today],
        breakDates: [],
        streakCount: 1,
        longestStreak: 1,
        lastCompleted: today,
      });

      await streak.save();
      return res.status(200).json(streak);
    }

    if (streak.lastCompleted && isSameDay(today, streak.lastCompleted)) {
      return res.status(400).json({ message: 'Streak already counted for today' });
    }

    streak.completedDates.push(today);

    if (streak.lastCompleted && isSameDay(today, streak.lastCompleted)) {
      streak.streakCount += 1;
    } else {
      streak.breakDates.push(streak.lastCompleted);
      streak.streakCount = 1;
    }

    if (streak.streakCount > streak.longestStreak) {
      streak.longestStreak = streak.streakCount;
    }

    streak.lastCompleted = today;
    await streak.save();

    res.status(200).json(streak);
  } catch (error) {
    next(error);
  }
};

const resetStreak = async (req, res, next) => {
  try {
    const streak = await Streak.findOne({ userId: req.userId });

    if (!streak) {
      return res.status(404).json({ message: 'Streak not found' });
    }

    streak.streakCount = 0;
    streak.lastCompleted = null;
    streak.completedDates = [];
    streak.breakDates = [];

    await streak.save();
    res.status(200).json({ message: 'Streak has been reset', streak });
  } catch (error) {
    next(error);
  }
};


const isSameDay = (d1, d2) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

export { getStreak, updateStreak, resetStreak };
