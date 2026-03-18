import {createOrUpdateProfile , getProfile} from "../controllers/profile.controller.js"
import express from "express"
import {authMiddleware} from "../middlewares/auth.middleware.js"

const Router = express.Router()

Router.post("/upload/profile",createOrUpdateProfile)
Router.get("/get/profile",getProfile)

export default Router