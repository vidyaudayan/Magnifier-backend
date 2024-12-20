import express from 'express';
import signup, { addProfilePic, applyJob, getProfile, getUserMetrics, initializeWallet, login, logout, sendOTP, verifyOTP } from '../controllers/userController.js'; // Adjust the path
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import cors from 'cors'
const userRouter = express.Router();
const corsOptions = {
    origin: 'https://magnifyweb.netlify.app', // Allow only your frontend's origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,               // Allow credentials (cookies, etc.)
    optionsSuccessStatus: 200        // For legacy browser support
  };

  userRouter.use(cors(corsOptions));

userRouter.use(express.json());
userRouter.options('*', cors(corsOptions));
// Define a preflight response for all routes

userRouter.use("/user",userRouter)

userRouter.post("/signup", signup);

userRouter.post("/login", login); 
userRouter.get("/userprofile",authMiddleware, getProfile); 


userRouter.post("/add-profilepic",authMiddleware, upload.single('profilePic'), addProfilePic)

userRouter.post("/jobapplication",authMiddleware,upload.single("resume"),applyJob)
userRouter.post("/wallet",authMiddleware,initializeWallet)
userRouter.get("/usermatrics",authMiddleware, getUserMetrics)
userRouter.post("/logout",logout)

userRouter.post("/send-otp",sendOTP)
userRouter.post("/verify-otp", verifyOTP)
  export default userRouter;    