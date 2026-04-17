import Notification from "../models/notificationModel.js";
import Task from "../models/TaskModel.js";
import ToDo from "../models/ToDoModel.js";

const getNotificationsForUser = async (req, res) => {
  const { userId } = req.params;

  try {
    console.log("hello why?! : " + userId);
    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findByIdAndUpdate(notificationId, {
      read: true,
    });
    res
      .status(200)
      .json({ message: "Notification marked as read", notification });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking notification as read", error });
  }
};

const checkTaskDeadlines = async (req, res) => {
  const now = new Date();
  const { userId } = req; 

  try {
    const tasksNearDeadline = await Task.find({
      userId: userId,
      dueDate: {
        $gte: now,
        $lte: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      completed: false,
    });

    if (tasksNearDeadline.length === 0) {
      return res.status(200).json({
        message: "No tasks near the deadline.",
        tasks: [], 
      });
    }

    const tasksWithTimeRemaining = tasksNearDeadline.map((task) => {
      const timeRemaining = (new Date(task.deadline) - now) / (1000 * 60);
      return {
        title: task.title,
        priority: task.priority,
        timeRemaining: `${Math.floor(
          timeRemaining / 60
        )} hours and ${Math.floor(timeRemaining % 60)} minutes`, 
      };
    });

    res.status(200).json({
      message: "Deadline notifications created for tasks nearing deadline.",
      tasks: tasksWithTimeRemaining,
    });

    tasksNearDeadline.forEach(async (task) => {
      const message = `Your task "${task.title}" is nearing its deadline.`;
      const link = `/task/${task._id}`; 
      const notification = new Notification({
        user: task.userId,
        message,
        type: "urgent",
        link,
      });

      await notification.save();
    });
  } catch (error) {
    console.error("Error checking task deadlines:", error);
    res.status(500).json({ message: "Error checking task deadlines", error });
  }
};

const checkTodoDeadlines = async (req, res) => {
  const now = new Date();
  const { userId } = req;
  console.log("userId : " + userId);

  try {
    const todosNearDeadline = await ToDo.find({
      userId: userId,
      dueDate: {
        $gte: now, 
        $lte: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      completed: false,
    });

    if (todosNearDeadline.length === 0) {
      return res.status(200).json({
        message: "No to-dos near the deadline.",
        todos: [], 
      });
    }

    const todosWithTimeRemaining = todosNearDeadline.map((todo) => {
      const timeRemaining = (new Date(todo.dueDate) - now) / (1000 * 60); 
      return {
        title: todo.title,
        priority: todo.priority,
        timeRemaining: `${Math.floor(
          timeRemaining / 60
        )} hours and ${Math.floor(timeRemaining % 60)} minutes`, 
      };
    });

    res.status(200).json({
      message: "Deadline notifications created for to-dos nearing deadline.",
      todos: todosWithTimeRemaining,
    });

    todosNearDeadline.forEach(async (todo) => {
      const message = `Your to-do "${todo.title}" is nearing its deadline.`;
      const link = `/todo/${todo._id}`;
      const notification = new Notification({
        user: todo.userId,
        message,
        type: "urgent",
        link,
      });

      await notification.save();
    });
  } catch (error) {
    console.error("Error checking to-do deadlines:", error);
    res.status(500).json({ message: "Error checking to-do deadlines", error });
  }
};

export {
  getNotificationsForUser,
  markNotificationAsRead,
  checkTaskDeadlines,
  checkTodoDeadlines,
};
