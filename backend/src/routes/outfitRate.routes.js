import express from "express"
import { rateOutfitController, rateSavedOutfitController } from "../controllers/outiftRate.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"

const Router = express.Router()

Router.post("/rate", authMiddleware, rateOutfitController)
Router.post("/rate-saved", authMiddleware, rateSavedOutfitController)

export default Router