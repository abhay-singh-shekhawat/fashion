import mongoose from "mongoose"
import {api_error} from "../utils/errorHandler.js"

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DB_URL)
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (error) {
        throw new api_error("Database connection failed", 500)
    }
}

export default connectDB