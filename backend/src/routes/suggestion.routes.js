import { getOutfitSuggestion , getDailyRecommendations , getShoppingSuggestions} from "../controllers/suggestion.controller.js";
import express from "express"

const Router = express.Router()

Router.get("/get/outfit/sugestions",getOutfitSuggestion);
Router.get("/get/daily/recommendations",getDailyRecommendations)
Router.get("/get/shopping",getShoppingSuggestions)

export default Router