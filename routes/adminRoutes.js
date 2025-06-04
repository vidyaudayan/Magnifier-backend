import express from 'express';

import cors from 'cors'
import { adminSingin, adminSingup, approvePost, fetchPendingPosts, RejectPost, updatePostStatus,getAvailableSlots,pinPost, bookSlot, getAllUsers, getAllPosts, getApprovedPosts } from '../controllers/adminController.js';
import { logout } from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { getJobApplications } from '../controllers/jobapplyController.js';
import { getAllContacts } from '../controllers/contactController.js';

const adminRouter = express.Router();
adminRouter.use("/admin",adminRouter)

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
    

{/*const corsOptions = {
    origin: 'https://magnifyweb.netlify.app', // Allow only your frontend's origin
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],              // Allow credentials (cookies, etc.)
    optionsSuccessStatus: 200        // For legacy browser support
  };*/}

  adminRouter.use(cors(corsOptions));

adminRouter.use(express.json());
adminRouter.options('*', cors(corsOptions));

adminRouter.post("/signup",adminSingup)
adminRouter.post("/signin",adminSingin)
adminRouter.get("/pending", fetchPendingPosts)
adminRouter.patch("/approve/:id",approvePost)
adminRouter.patch("/reject/:id",RejectPost)
adminRouter.post("/updatepoststatus", updatePostStatus)
adminRouter.post("/logout",logout) 

adminRouter.get("/available-slots", getAvailableSlots);
adminRouter.post("/pinpost",pinPost)
adminRouter.post("/book-slot",authMiddleware,  bookSlot)
   
adminRouter.get("/get-allusers",getAllUsers)
adminRouter.get("/get-allposts",getAllPosts)
adminRouter.get("/getJobApplications", getJobApplications)
adminRouter.get("/getallcontacts", getAllContacts)

adminRouter.get("/get-approved-posts", getApprovedPosts)

export default adminRouter  