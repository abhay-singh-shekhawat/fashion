import { getOccasionSuggestion , getDailyRecommendations , getShoppingSuggestions} from "../controllers/suggestion.controller.js";
import express from "express"
import {authMiddleware} from "../middlewares/auth.middleware.js"

const Router = express.Router()

Router.get("/get/occasion/suggestions" , authMiddleware , getOccasionSuggestion);
Router.get("/get/daily/recommendations" , authMiddleware , getDailyRecommendations)
Router.get("/get/shopping", authMiddleware , getShoppingSuggestions)

export default Router