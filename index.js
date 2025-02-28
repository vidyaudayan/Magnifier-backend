import express from 'express'
import http from "http";
import cors from 'cors'
import connectDb from './config/db.js'
import cookieParser from "cookie-parser";
import bodyParser from 'body-parser';
import { Server } from "socket.io";
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
import adminRouter from './routes/adminRoutes.js'
import { cleanupInactiveUsers, resetSlotsDaily, unpinExpiredPosts } from './jobs/cleanupInactiveUsers.js';
import { generateSlotsForDay } from './jobs/slotgenerate.js';
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


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/v1/user',userRouter)
app.use('/api/v1/post',postRouter)
app.use('/api/v1/admin',adminRouter)
app.get('/', (req, res) => {
  res.send('Hello World!')
})
connectDb() 


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
unpinExpiredPosts()
generateSlotsForDay();
resetSlotsDaily()

server.listen(port, () => {
  console.log(` Listening on port ${port}`);
});   