import Timer from "../models/TimerModel.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Create a new timer
const createTimer = async (req, res, next) => {
  try {
    const { startTime, endTime, date } = req.body;

    // Validate required fields
    if (!startTime || !endTime || !date) {
      return res
        .status(400)
        .json({ error: "Start time, end time, and date are required." });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ error: "Invalid date format." });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = (end - start) / 1000; // Calculate duration in seconds

    // Check if the duration is valid
    if (duration < 0) {
      return res
        .status(400)
        .json({ error: "End time must be after start time." });
    }

    // Create new timer document and save it in the database
    const newTimer = await Timer.create({
      userId: req.userId,
      startTime,
      endTime,
      duration,
      date: parsedDate, // Save date as a proper Date object
    });

    res.status(201).json(newTimer); // Return the newly created timer
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while creating timer" });
    next(error);
  }
};

// Get all timers for a user
const getTimers = async (req, res, next) => {
  try {
    const timers = await Timer.find({ userId: req.userId });
    res.status(200).json(timers); // Use 200 for successful GET requests
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching timers" });
    next(error);
  }
};

// Get timers for a specific day
const getTimersOfDay = async (req, res, next) => {
  try {
    const { date } = req.params;
    const parsedDate = new Date(date + "T00:00:00.000Z");
    const nextDay = new Date(parsedDate);
    nextDay.setUTCDate(parsedDate.getUTCDate() + 1);

    const timers = await Timer.find({
      userId: req.userId,
      startTime: {
        $gte: parsedDate,
        $lt: nextDay,
      },
    });
    res.status(200).json(timers);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Server error while fetching timers of the day" });
    next(error);
  }
};

// Get timer by ID
const getTimerById = async (req, res, next) => {
  try {
    const timer = await Timer.findById(req.params.id);
    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }
    res.status(200).json(timer);
  } catch (error) {
    res.status(500).json({ error: "Server error while fetching timer by ID" });
    next(error);
  }
};

// Calculate total duration of timers for a specific day
const getTimerDurationOfDay = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { userId } = req;

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({
        error: "Invalid date format. Please provide date in YYYY-MM-DD format.",
      });
    }

    const parsedDate = new Date(date + "T00:00:00.000Z");
    const nextDay = new Date(parsedDate);
    nextDay.setUTCDate(parsedDate.getUTCDate() + 1);

    console.log("Parsed Date:", parsedDate);
    console.log("Next Day:", nextDay);

    // Querying timers for the specific day based on the startTime field
    const timers = await Timer.find({
      userId: req.userId,
      startTime: {
        $gte: parsedDate,
        $lt: nextDay,
      },
    });
    let duration = 0;
    for (let i = 0; i < timers.length; i++) {
      // console.log(timer.duration)
      duration += timers[i].duration;
    }

    console.log("Timer Duration Result:", duration);

    if (duration == 0) {
      return res
        .status(404)
        .json({ message: "No timers found for this date." });
    }

    res.status(200).json({
      totalDuration: duration, // Return the total duration
    });
  } catch (error) {
    console.error("Error in getTimerDurationOfDay:", error);
    res
      .status(500)
      .json({ error: "Server error while calculating total duration" });
    next(error);
  }
};

// Use model to predict  best time for the user
const predictBestTime = async (req, res, next) => {
  try {
    const userId = req.userId;
    const newActivity = req.body.newActivity; // Get newActivity from request body

    // Prepare the payload to send to Flask API
    const payload = {
      userId: userId,
      newActivity: newActivity,
    };

    // Send POST request to Flask API
    const flaskResponse = await axios.post(
      `${process.env.FLASK_API}/predict_activity`,
      payload
    ); // Update the URL if needed

    // a frame work :  basically like express conitnue

    // Handle Flask response
    const suggestion = flaskResponse.data.suggestion; // Get the suggestion from Flask API response

    // Send the suggestion back to the client
    res.status(200).json({ suggestion });
  } catch (error) {
    console.error("Error in predictBestTime:", error);
    res.status(500).json({ error: "Server error while predicting" });
    next(error);
  }
};

export {
  createTimer,
  getTimers,
  getTimersOfDay,
  getTimerById,
  getTimerDurationOfDay,
  predictBestTime,
};
