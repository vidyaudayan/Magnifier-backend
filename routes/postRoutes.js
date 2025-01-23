import express from 'express';
import { createPost,getPosts,likePosts,dislikePosts,addComment } from '../controllers/postController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware, authMiddleware1 } from '../middlewares/authMiddleware.js';
import cors from 'cors'
const postRouter = express.Router();
postRouter.use("/post",postRouter)

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
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],              // Allow credentials (cookies, etc.)
    optionsSuccessStatus: 200        // For legacy browser support
  };*/}

  postRouter.use(cors(corsOptions));

postRouter.use(express.json());
postRouter.options('*', cors(corsOptions));
// Define a preflight response for all routes

  

postRouter.post("/create",authMiddleware,upload.single("media"), createPost);

postRouter.get("/", getPosts); 

postRouter.patch('/:postId/like',authMiddleware, likePosts);

postRouter.patch('/:postId/dislike',authMiddleware, dislikePosts);


postRouter.post('/:postId/comment',authMiddleware, addComment);

export default postRouter; 