import express from 'express'
import cors from 'cors'

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes import
import userRouter from './functions/src/routes/user.route.js'

//routes declaration
app.use(userRouter)

app.listen(PORT, () => console.log(`✅ Server running on port ${process.env.PORT}`));
