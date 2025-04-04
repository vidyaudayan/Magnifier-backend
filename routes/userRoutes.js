import express from 'express';
import signup, { addProfilePic, applyJob, getProfile, getUserMetrics, initializeWallet, login, logout, sendOTP, verifyOTP,forgotPassword,resetPassword, getUserPosts, userSearch, getSearchedUserPosts,addCoverPic, sendMobileOtp, verifyMobileOtp, deactivateUserAccount, getProfileById} from '../controllers/userController.js'; // Adjust the path
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import cors from 'cors'
import { saveContact } from '../controllers/contactController.js';
import { getPostById } from '../controllers/postController.js';
import { createOrder, createPaymentIntent, verifyPayment } from '../controllers/paymentController.js';
const userRouter = express.Router();
const allowedOrigins =['https://magnifyweb.netlify.app', 'http://localhost:5173','https://magnifieradmin.netlify.app'];


import Stripe from "stripe";
import Payment from "../Model/paymentModel.js";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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
    

{/*const corsOptions = {
    origin: 'https://magnifyweb.netlify.app', // Allow only your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,               // Allow credentials (cookies, etc.)
    optionsSuccessStatus: 200        // For legacy browser support
  };*/}

  userRouter.use(cors(corsOptions));

userRouter.use(express.json());
userRouter.options('*', cors(corsOptions));
// Define a preflight response for all routes

userRouter.use("/user",userRouter)

userRouter.post("/signup", signup);

userRouter.post("/login", login); 
userRouter.get("/userprofile",authMiddleware, getProfile); 

userRouter.get("/userprofile/:id", getProfileById);

userRouter.post("/add-profilepic",authMiddleware, upload.single('profilePic'), addProfilePic)
userRouter.post("/add-coverpic",authMiddleware, upload.single('coverPic'), addCoverPic)

userRouter.get("/userPosts",authMiddleware,getUserPosts)
userRouter.post("/jobapplication",upload.single("resume"),applyJob)
userRouter.post("/wallet",authMiddleware,initializeWallet)
userRouter.get("/usermatrics",authMiddleware, getUserMetrics)
userRouter.post("/logout",logout)   
 
userRouter.post("/send-otp",sendOTP) 
userRouter.post("/verify-otp", verifyOTP)

userRouter.post("/send-mobileotp",sendMobileOtp)
userRouter.post("/verify-mobileotp", verifyMobileOtp)

userRouter.post("/forgot-password", forgotPassword);

userRouter.get("/search",userSearch)
userRouter.get("/posts/:userId", getSearchedUserPosts);

userRouter.post("/reset-password", resetPassword);
userRouter.post("/contact",upload.single("identityProof"),saveContact)
 

userRouter.patch("/deactivateaccount",authMiddleware, deactivateUserAccount)


// Payment
userRouter.post("/payment",authMiddleware,createOrder)
userRouter.post("/create-payment-intent",authMiddleware,createPaymentIntent)
userRouter.post("/verifypayment",authMiddleware,verifyPayment)


userRouter.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"]; // Get Stripe signature from headers

  try {
    // Verify Stripe Webhook
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;

      // Find and update payment in DB
      const updatedPayment = await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: "succeeded" },
        { new: true }
      );

      if (updatedPayment) {
        console.log(`✅ Payment ${paymentIntent.id} succeeded and updated in DB`);
      } else {
        console.log(`⚠️ PaymentIntent ${paymentIntent.id} not found in DB`);
      }
    }

    res.status(200).send({ received: true });
  } catch (err) {
    console.error("🚨 Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});


export default userRouter;         