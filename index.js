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
import Stripe from "stripe";
 import Payment from './Model/paymentModel.js';
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

import webhookRoutes from "./routes/userRoutes.js"

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins; modify for security
    methods: ["GET", "POST"],
  },
})
app.use(bodyParser.json())
{/*const corsOptions = {
  origin: 'https://magnifyweb.netlify.app', // Replace with your frontend's URL
  credentials: true, 
  optionsSuccessStatus: 200               // Allow credentials (cookies, etc.)
};*/}

const allowedOrigins =['https://magnifyweb.netlify.app', 'http://localhost:5173','http://localhost:5174','https://magnifieradmin.netlify.app'];

  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }  
    },
    credentials: true,   
    optionsSuccessStatus: 200 ,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],     
  };    
     
       
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

connectDb() 

app.post("/api/v1/user/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  console.log("🔹 Webhook received:", req.body);

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log("✅ Stripe Event Verified:", event.type);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      console.log("🔹 Payment Success:", paymentIntent.id);
      console.log("🔹 Metadata:", paymentIntent.metadata);

      if (!paymentIntent.metadata.userId) {
        console.error("🚨 Missing metadata in paymentIntent!");
        return res.status(400).json({ error: "Missing metadata" });
      }

      // Extract metadata
      const { userId, duration, startHour, endHour } = paymentIntent.metadata;

      // Save the payment to DB
      const newPayment = new Payment({
        userId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentIntentId: paymentIntent.id,
        duration,
        startHour,
        endHour,
        status: "succeeded",
      });

      await newPayment.save();
      console.log(`✅ Payment ${paymentIntent.id} successfully saved in DB`);

      res.status(200).send({ received: true });
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
      res.status(200).send({ received: true });
    }
  } catch (err) {
    console.error("🚨 Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});




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