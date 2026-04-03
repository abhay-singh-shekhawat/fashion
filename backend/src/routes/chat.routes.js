import { chatWithStylist } from "../controllers/chat.controller.js";
import {authMiddleware} from "../middlewares/auth.middleware.js"
import express from "express"

const Router = express.Router()

Router.post("/chat", authMiddleware , chatWithStylist)

export default Router
