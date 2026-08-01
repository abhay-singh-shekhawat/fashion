import { agenticChat } from "../controllers/agenticChat.controller.js";
import express from "express"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import upload from "../utils/uploads/multer.js"

const Router = express.Router()

Router.post("/chat", authMiddleware, upload.single("image"), agenticChat)

export default Router