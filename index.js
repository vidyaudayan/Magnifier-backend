import express from 'express'
import cors from 'cors'
import connectDb from './config/db.js'
import cookieParser from "cookie-parser";
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
const app = express()

const corsOptions = {
  origin: 'http://localhost:5173', // Replace with your frontend's URL
  credentials: true, 
  optionsSuccessStatus: 200               // Allow credentials (cookies, etc.)
};
 
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

const port = 3000
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/v1/user',userRouter)
app.use('/api/v1/post',postRouter)
app.get('/', (req, res) => {
  res.send('Hello World!')
})
connectDb()
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})