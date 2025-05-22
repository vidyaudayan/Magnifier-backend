import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors'
import dashboardMapping from "../utils/dashboardMapping.js";
const dashboardRouter = express.Router();
import dotenv from "dotenv";
import { validateState } from '../middlewares/stateValidator.js';
import {authMiddleware} from '../middlewares/authMiddleware.js'
import {displayDashboard} from "../controllers/dashboardController.js"

dotenv.config();
const allowedOrigins =['https://magnifyweb.netlify.app', 'http://localhost:5173','https://magnifieradmin.netlify.app'];

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
  

  dashboardRouter.use(cors(corsOptions));

dashboardRouter.use(express.json());
dashboardRouter.options('*', cors(corsOptions));

dashboardRouter.use("/dashboard",dashboardRouter)



dashboardRouter.get('/:type',authMiddleware,displayDashboard );

export default dashboardRouter;
