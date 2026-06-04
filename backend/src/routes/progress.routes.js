import express from "express"
import { getProgress } from "../controllers/progress.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const Router = express.Router()

Router.get("/get/progress", authMiddleware, getProgress)

export default Router
