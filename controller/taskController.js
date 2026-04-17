import Task from "../models/TaskModel.js";
import Streak from "../models/StreakModel.js";
import Notification from "../models/notificationModel.js";

const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      dueDate,
      priority,
      recurring,
      recurrenceFrequency,
      dependentOn,
      tags,
    } = req.body;

    if (dependentOn) {
      const dependentTask = await Task.findById(dependentOn);
      if (!dependentTask) {
        return res
          .status(400)
          .json({ message: "Dependent task does not exist" });
      }
    }

    const task = await Task.create({
      userId: req.userId,
      title,
      description,
      dueDate,
      priority,
      recurring,
      recurrenceFrequency,
      dependentOn,
      tags,
    });

    const notification = new Notification({
      user: req.userId,
      message: `Task "${task.title}" has been created.`,
      type: "normal",
      link: `/task/${task._id}`,
    });

    await notification.save();
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const { status, priority, dueDate, page = 1, limit = 10 } = req.query;

    const filter = { userId: req.userId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (dueDate) filter.dueDate = { $lte: new Date(dueDate) };
    const tasks = await Task.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.dependentOn) {
      const dependentTask = await Task.findById(task.dependentOn);
      if (dependentTask && !dependentTask.completed) {
        return res.status(400).json({
          message: "Cannot complete task until dependent task is done",
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );

    if (updates.dueDate || updates.priority) {
      const notification = new Notification({
        user: req.userId,
        message: `Task "${task.title}" has been updated.`,
        type: "normal",
        link: `/task/${task._id}`,
      });

      await notification.save();
    }
    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { deleteRecurring } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.recurring && !deleteRecurring) {
      await Task.findByIdAndUpdate(taskId, { recurring: false });
      return res
        .status(200)
        .json({ message: "Recurring task deleted for this instance only" });
    }

    await Task.findByIdAndDelete(taskId);

    const notification = new Notification({
      user: req.userId,
      message: `Task "${task.title}" has been deleted.`,
      type: "general",
      link: `/task/${taskId}`,
    });

    await notification.save();
    //below line i want to send teh response as well that the tsak is deleted
    res.status(200).json({ message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};

const getOverdueTasks = async (req, res, next) => {
  try {
    const overdueTasks = await Task.find({
      userId: req.userId,
      dueDate: { $lt: new Date() },
      completed: false,
    });

    res.status(200).json(overdueTasks);
  } catch (error) {
    next(error);
  }
};

const markTaskInProgress = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "completed") {
      return res.status(400).json({ message: "Task already completed" });
    }

    task.status = "completed";
    task.completed = true;
    task.updatedAt = Date.now();
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
      return res.status(200).json({ task, streak });
    }

    if (streak.lastCompleted && isSameDay(today, streak.lastCompleted)) {
      return res
        .status(400)
        .json({ message: "Streak already counted for today" });
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

    res.status(200).json({ task, streak });
  } catch (error) {
    next(error);
  }
};

const getTasksByTag = async (req, res, next) => {
  try {
    const { tag } = req.body;

    const tasks = await Task.find({ tags: { $regex: tag, $options: "i" } });

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this tag" });
    }

    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

export {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getOverdueTasks,
  markTaskInProgress,
  getTasksByTag,
};
