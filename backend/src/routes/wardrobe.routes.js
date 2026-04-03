import express from "express"
import { addClothingItem , getWardrobe , getWardrobeSuggestions , getOccasionSuggestion} from "../controllers/wardrobe.controller.js"
import {authMiddleware} from "../middlewares/auth.middleware.js"

const Router = express.Router()

Router.post("/add/item", authMiddleware , addClothingItem)
Router.get("/get/wardrobe", authMiddleware , getWardrobe)
Router.get("/get/suggestions", authMiddleware , getWardrobeSuggestions)
Router.get('/api/suggestions/occasion', authMiddleware , getOccasionSuggestion);

export default Router