import dotenv from "dotenv"
dotenv.config()

import express from "express"
import cors from "cors"
import  connectDB  from "./src/configs/db.js"

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

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

import profileRouter from "./src/routes/profile.route.js"
app.use("/api/v1/profile",profileRouter)

import suggestionRouter from "./src/routes/suggestion.routes.js"
app.use("/api/v1/suggestion",suggestionRouter)

import scanRouter from "./src/routes/scan.route.js"
app.use("/api/v1/scan",scanRouter)
