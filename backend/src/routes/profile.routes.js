import {createOrUpdateProfile , getProfile} from "../controllers/profile.controller.js"
import express from "express"
import {authMiddleware} from "../middlewares/auth.middleware.js"
import { profileSchema } from "../validators/schemas.validator.js"
import { validate } from "../middlewares/validate.middleware.js"

const Router = express.Router()

Router.post("/upload/profile", authMiddleware , validate(profileSchema),createOrUpdateProfile)
Router.get("/get/profile", authMiddleware , getProfile)

export default Router