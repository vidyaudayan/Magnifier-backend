import express from 'express';
import signup, { addProfilePic, applyJob, getProfile, getUserMetrics, initializeWallet, login, logout, sendOTP, verifyOTP,forgotPassword,resetPassword, getUserPosts, userSearch, getSearchedUserPosts,addCoverPic, sendMobileOtp, verifyMobileOtp, deactivateUserAccount, getProfileById, deleteProfilePic, deleteCoverPic} from '../controllers/userController.js'; // Adjust the path
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import cors from 'cors'
import { saveContact } from '../controllers/contactController.js';
import { getPostById } from '../controllers/postController.js';
import { createOrder, createPaymentIntent, handlePaymentFailure, verifyPayment } from '../controllers/paymentController.js';
const userRouter = express.Router();
const allowedOrigins =['https://magnifyweb.netlify.app', 'http://localhost:5173','https://magnifieradmin.netlify.app', 'http://localhost:5000','http://localhost:5174'];




import Payment from "../Model/paymentModel.js";
import dotenv from "dotenv";
import { validateState } from '../middlewares/stateValidator.js';
import { getWalletBalance, rechargeWallet } from '../controllers/walletController.js';

dotenv.config();

  
{/*const corsOptions = {
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
  }; */}   
    

{/*const corsOptions = {
    origin: 'https://magnifyweb.netlify.app', // Allow only your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,               // Allow credentials (cookies, etc.)
    optionsSuccessStatus: 200        // For legacy browser support
  };*/}

  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  };
  

  userRouter.use(cors(corsOptions));

userRouter.use(express.json());
userRouter.options('*', cors(corsOptions));
// Define a preflight response for all routes

userRouter.use("/user",userRouter)

userRouter.post("/signup",validateState, signup);

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

userRouter.post("/send-mobileotp", sendMobileOtp)
userRouter.post("/verify-mobileotp", verifyMobileOtp)

userRouter.post("/forgot-password", forgotPassword);

userRouter.get("/search",userSearch)
userRouter.get("/posts/:userId", getSearchedUserPosts);
  
userRouter.post("/reset-password", resetPassword);
userRouter.post("/contact",upload.single("identityProof"),saveContact)
 userRouter.delete("/delete-profilepic",authMiddleware,deleteProfilePic)
userRouter.delete("/delete-coverpic", authMiddleware, deleteCoverPic);
userRouter.patch("/deactivateaccount",authMiddleware, deactivateUserAccount)
 

// Payment
userRouter.post("/payment",authMiddleware,createOrder)
userRouter.post("/create-payment-intent",authMiddleware,createPaymentIntent)
userRouter.post("/verifypayment",authMiddleware,verifyPayment)
userRouter.post('/payment-failed', authMiddleware,handlePaymentFailure);

// Wallet

userRouter.get('/balance', authMiddleware, getWalletBalance);
userRouter.post('/recharge', authMiddleware, rechargeWallet);

export default userRouter;         