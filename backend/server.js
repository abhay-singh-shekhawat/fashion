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

app.get("/",(req,res)=>{
    res.json({
        message : "server is running"
    })
})