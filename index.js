import express from 'express'
import http from "http";
import cors from 'cors'
import connectDb from './config/db.js'
import { syncTime } from './utils/timeSync.js';
import cookieParser from "cookie-parser";
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { Server } from "socket.io";
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import adminRouter from './routes/adminRoutes.js'
import dashboardRouter from "./routes/dashboardRoutes.js"
import { cleanupInactiveUsers, unpinExpiredPosts,processStickyPosts, releaseExpiredSlots } from './jobs/cleanupInactiveUsers.js';
import {  generateSlotsForWeek } from './jobs/slotgenerate.js';
import Slot from './Model/slotModel.js';
import { initializeSlotSystem } from './jobs/slotgenerate.js';
 
// One-time migration
export const migrateToDatedSlots = async () => {
  try {
    // 1. Clean up legacy data
    const deleteResult = await Slot.deleteMany({ 
      date: { $exists: false } 
    });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} legacy slots`);

    // 2. Fix existing null postId duplicates
    await Slot.aggregate([
      { $match: { postId: null } },
      { $group: { 
        _id: { date: "$date", startHour: "$startHour", endHour: "$endHour" },
        duplicates: { $push: "$_id" },
        count: { $sum: 1 } 
      }},
      { $match: { count: { $gt: 1 } } },
      { $project: { 
        keep: { $arrayElemAt: ["$duplicates", 0] },
        delete: { $slice: ["$duplicates", 1, { $size: "$duplicates" }] }
      }}
    ]).then(async (results) => {
      const idsToDelete = results.flatMap(r => r.delete);
      if (idsToDelete.length > 0) {
        await Slot.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`🧹 Cleaned up ${idsToDelete.length} duplicate null-postId slots`);
      }
    });

    // 3. Ensure proper indexes
    await Slot.collection.dropIndexes()
      .then(() => {
        console.log('🗂 Dropped all indexes');
        return Slot.syncIndexes();
      })
      .then(() => console.log('🔄 Recreated indexes'));

    // 4. Generate fresh slots
    await generateSlotsForWeek();
    
    console.log("🔄 Successfully migrated to dated slots system");
    return { success: true };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};   

import dotenv from "dotenv";
  
dotenv.config();
console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS);

syncTime();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000; // Use PORT from env or default to 3000

// CORS Configuration
const allowedOrigins = [
  'https://magnifyweb.netlify.app', 
  'http://localhost:5173',
  'http://localhost:5174',
  'https://magnifieradmin.netlify.app',
  'https://magnifier-platform.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Security Headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ 'unsafe-inline'; " +
    "frame-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; " +
    "style-src 'self' 'unsafe-inline'; " +
    `connect-src 'self' https://identitytoolkit.googleapis.com/ https://www.google.com/recaptcha/ ws://localhost:${PORT} wss://magnifier-backend.onrender.com`
  );
  next();
});

// Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/post', postRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.get('/', (req, res) => res.send('Hello World!'));

// Socket.io Events
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("slotBooked", () => io.emit("updateSlots"));
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

// Database and Server Initialization
async function startServer() {
  try {
    await connectDb();
    await mongoose.connect(process.env.DB_URL);
    await initializeSlotSystem();
    await migrateToDatedSlots();

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io available on ws://localhost:${PORT}`);
    });

    // Background jobs
    cleanupInactiveUsers();
    releaseExpiredSlots();
    unpinExpiredPosts();
    setInterval(unpinExpiredPosts, 30 * 60 * 1000);
    setInterval(processStickyPosts, 60 * 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io, server };