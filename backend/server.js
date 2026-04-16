import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import  connectDB  from "./src/configs/db.js"
import errorHandler from "./src/middlewares/errorHandler.js"
import rateLimit from "express-rate-limit"
import os from "os"

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                 // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

app.use(errorHandler)

// Start background workers
import('./src/workers/scanWorker.js').catch(err => {
  console.error('Failed to start scan worker:', err);
});

connectDB().then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}).catch((err) => {
    console.error(`error in db connection ${err.message}`)
    process.exit(1)
});


// Routes
import authRouter from "./src/routes/auth.routes.js"
app.use("/api/v1/user",authRouter);

import profileRouter from "./src/routes/profile.routes.js"
app.use("/api/v1/profile",profileRouter)

import suggestionRouter from "./src/routes/suggestion.routes.js"
app.use("/api/v1/suggestion",suggestionRouter)

import scanRouter from "./src/routes/scan.routes.js"
app.use("/api/v1/scan",scanRouter)

import wardrobeRouter from "./src/routes/wardrobe.routes.js"
app.use("/api/v1/wardrobe",wardrobeRouter)
