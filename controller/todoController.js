import ToDo from "../models/ToDoModel.js";
import Notification from "../models/notificationModel.js";

const createToDo = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    const now = new Date();

    // Convert dueDate to a Date object if it's a date string
    let dueDateObj = new Date(dueDate);

    // Check if the due date is today and no specific time is set (defaults to 00:00)
    if (
      dueDateObj.toDateString() === now.toDateString() && // Same day
      dueDateObj.getHours() === 0 && dueDateObj.getMinutes() === 0 // No specific time set
    ) {
      // Default the due date to 4 hours from the current time
      dueDateObj = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    }

    const toDo = await ToDo.create({
      userId: req.userId,
      title,
      description,
      dueDate: dueDateObj, // Save the adjusted due date
      priority,
    });

    const notification = new Notification({
      user: req.userId,
      message: `To-Do "${toDo.title}" has been created.`,
      type: "normal",
      link: `/todo/${toDo._id}`, // Link to the to-do page
    });

    await notification.save();

    res.status(201).json(toDo);
  } catch (error) {
    next(error);
  }
};



const getToDos = async (req, res, next) => {
  try {
    const toDos = await ToDo.find({ userId: req.userId });
    res.status(200).json(toDos);
  } catch (error) {
    next(error);
  }
};

const updateToDo = async (req, res, next) => {
  try {
    const { toDoId } = req.params;
    const updatedToDo = await ToDo.findByIdAndUpdate(toDoId, req.body, {
      new: true,
    });

    if (!updatedToDo) {
      return res.status(404).json({ message: "To-Do not found" });
    }

    res.status(200).json(updatedToDo);
  } catch (error) {
    next(error);
  }
};

const deleteToDo = async (req, res, next) => {
  try {
    const { toDoId } = req.params;
    const toDo = await ToDo.findByIdAndDelete(toDoId);

    if (!toDo) {
      return res.status(404).json({ message: "To-Do not found" });
    }
    await ToDo.findByIdAndDelete(toDoId);

    const notification = new Notification({
      user: req.userId,
      message: `To-Do "${toDo.title}" has been deleted.`,
      type: "normal",
      link: `/todo/${toDoId}`,
    });

    await notification.save();


    res.status(200).json({ message: "To-Do Deleted" });
  } catch (error) {
    next(error);
  }
};

const markToDoCompleted = async (req, res, next) => {
  try {
    const { toDoId } = req.params;
    const toDo = await ToDo.findByIdAndUpdate(
      toDoId,
      { completed: true, updatedAt: Date.now() },
      { new: true }
    );

    if (!toDo) {
      return res.status(404).json({ message: "To-Do not found" });
    }

    res.status(200).json(toDo);
  } catch (error) {
    next(error);
  }
};


export { createToDo, getToDos, updateToDo, deleteToDo, markToDoCompleted };