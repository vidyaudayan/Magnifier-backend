import express from 'express';
import signup, { addProfilePic, applyJob, getProfile, getUserMetrics, initializeWallet, login, logout, sendOTP, verifyOTP,forgotPassword,resetPassword, getUserPosts, userSearch, getSearchedUserPosts,addCoverPic} from '../controllers/userController.js'; // Adjust the path
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import cors from 'cors'
import { saveContact } from '../controllers/contactController.js';
const userRouter = express.Router();
const allowedOrigins =['https://magnifyweb.netlify.app', 'http://localhost:5173','https://magnifieradmin.netlify.app'];

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


userRouter.post("/add-profilepic",authMiddleware, upload.single('profilePic'), addProfilePic)
userRouter.post("/add-coverpic",authMiddleware, upload.single('coverPic'), addCoverPic)

userRouter.get("/userPosts",authMiddleware,getUserPosts)
userRouter.post("/jobapplication",upload.single("resume"),applyJob)
userRouter.post("/wallet",authMiddleware,initializeWallet)
userRouter.get("/usermatrics",authMiddleware, getUserMetrics)
userRouter.post("/logout",logout)

userRouter.post("/send-otp",sendOTP)
userRouter.post("/verify-otp", verifyOTP)

userRouter.post("/forgot-password", forgotPassword);

userRouter.get("/search",userSearch)
userRouter.get("/posts/:userId", getSearchedUserPosts);

userRouter.post("/reset-password", resetPassword);
userRouter.post("/contact",upload.single("identityProof"),saveContact)
 
  export default userRouter;    