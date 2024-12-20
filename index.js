import express from 'express'
import cors from 'cors'
import connectDb from './config/db.js'
import cookieParser from "cookie-parser";
import bodyParser from 'body-parser';
import userRouter from './routes/userRoutes.js';
import postRouter from './routes/postRoutes.js';
const app = express()
app.use(bodyParser.json())
const corsOptions = {
  origin: 'https://magnifyweb.netlify.app', // Replace with your frontend's URL
  credentials: true, 
  optionsSuccessStatus: 200               // Allow credentials (cookies, etc.)
};
 
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/v1/user',userRouter)
app.use('/api/v1/post',postRouter)
app.get('/', (req, res) => {
  res.send('Hello World!')
})
connectDb()


const port = process.env.PORT;


app.listen(port, () => {
  console.log(` Listening on port ${port}`);
});