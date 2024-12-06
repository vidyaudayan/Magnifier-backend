import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

 const connectDb = async() => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("DB connected");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectDb;