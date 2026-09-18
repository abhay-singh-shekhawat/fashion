import express from "express"
import { rateOutfitController, rateSavedOutfitController } from "../controllers/outiftRate.js"
import {
  getRatingHistory,
  getRating,
  setFavourite,
  deleteRating
} from "../controllers/ratingHistory.controller.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import upload from "../utils/uploads/multer.js"

const Router = express.Router()

Router.post("/rate", authMiddleware, upload.single("image"), rateOutfitController)
Router.post("/rate-saved", authMiddleware, rateSavedOutfitController)

/* Stored ratings: the history list, one item, its favourite flag, and removal. */
Router.get("/history", authMiddleware, getRatingHistory)
Router.get("/history/:id", authMiddleware, getRating)
Router.patch("/history/:id/favourite", authMiddleware, setFavourite)
Router.delete("/history/:id", authMiddleware, deleteRating)

export default Router