import { getOutfitSuggestion , getDailyRecommendations} from "../controllers/suggestion.controller.js";
import express from "express"

const Router = express.Router()

Router.get("/get/outfit/sugestions",getOutfitSuggestion);
Router.get("/get/daily/recommendations",getDailyRecommendations)

export default Router