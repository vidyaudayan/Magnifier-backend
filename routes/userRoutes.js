import express from 'express';
import signup, { addProfilePic, applyJob, getProfile, login } from '../controllers/userController.js'; // Adjust the path
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import cors from 'cors'
const userRouter = express.Router();
const corsOptions = {
    origin: 'http://localhost:5173', // Allow only your frontend's origin
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
 
export default userRouter;    