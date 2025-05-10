import express from 'express'
import http from "http";
import cors from 'cors'
import connectDb from './config/db.js'
import cookieParser from "cookie-parser";
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { Server } from "socket.io";
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import adminRouter from './routes/adminRoutes.js'
import { cleanupInactiveUsers, resetSlotsDaily, unpinExpiredPosts,processStickyPosts, releaseExpiredSlots } from './jobs/cleanupInactiveUsers.js';
import { generateSlotsForDay } from './jobs/slotgenerate.js';

 import Payment from './Model/paymentModel.js';
import dotenv from "dotenv";

dotenv.config();




const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins; modify for security
    methods: ["GET", "POST"],
  },
})
app.use(bodyParser.json())
// server.js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ 'unsafe-inline'; " +
    "frame-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://identitytoolkit.googleapis.com/ https://www.google.com/recaptcha/"
  );
  next();
});
{/*const corsOptions = {
  origin: 'https://magnifyweb.netlify.app', // Replace with your frontend's URL
  credentials: true, 
  optionsSuccessStatus: 200               // Allow credentials (cookies, etc.)
};*/}

const allowedOrigins =['https://magnifyweb.netlify.app', 'http://localhost:5173','http://localhost:5174','https://magnifieradmin.netlify.app','https://magnifier-platform.com/'];


  
  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  };
  
   
    
       
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

connectDb() 






app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/v1/user',userRouter)
app.use('/api/v1/post',postRouter)
app.use('/api/v1/admin',adminRouter)
app.get('/', (req, res) => {
  res.send('Hello World!')
})



const port = process.env.PORT;
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("slotBooked", () => {
    io.emit("updateSlots");  // Broadcast update event to all clients
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});    

export { io, server }; 
  



  
cleanupInactiveUsers();
releaseExpiredSlots()
generateSlotsForDay();
resetSlotsDaily()

mongoose.connection.once("open", () => {
  console.log("✅ Connected to MongoDB");
  unpinExpiredPosts(); // Run once on startup
  setInterval(unpinExpiredPosts, 30 * 60 * 1000); // Run every 30 minutes
});

setInterval(processStickyPosts, 60 * 1000); // Runs every 1 minute


server.listen(port, () => {
  console.log(` Listening on port ${port}`);
});     