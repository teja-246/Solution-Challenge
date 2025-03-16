import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { onRequest } from "firebase-functions/v2/https";

const app = express();

app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static('public'))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.route.js'

// routes declaration
app.use("/api/v1/user", userRouter);

export const api = onRequest(app);
