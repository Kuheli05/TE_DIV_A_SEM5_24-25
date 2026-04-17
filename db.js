import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const dbURI = process.env.DB_CONNECTION;

  //thanks ... 
export const connectDB = async () => {
  try {
    await mongoose.connect(dbURI, {
      dbName: "TaskMan",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};
