import express from 'express';
import { createPost,getPosts,likePost,dislikePost,addComment } from '../controllers/postController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { authMiddleware, authMiddleware1 } from '../middlewares/authMiddleware.js';
import cors from 'cors'
const postRouter = express.Router();
postRouter.use("/post",postRouter)
const corsOptions = {
    origin: 'https://magnifyweb.netlify.app', // Allow only your frontend's origin
    credentials: true,               // Allow credentials (cookies, etc.)
    optionsSuccessStatus: 200        // For legacy browser support
  };

  postRouter.use(cors(corsOptions));

postRouter.use(express.json());
postRouter.options('*', cors(corsOptions));
// Define a preflight response for all routes

  

postRouter.post("/create",authMiddleware,upload.single("media"), createPost);

postRouter.get("/", getPosts); 

postRouter.patch('/:postId/like', likePost);

postRouter.patch('/:postId/dislike', dislikePost);


postRouter.post('/:postId/comment',authMiddleware, addComment);

export default postRouter;      