import express from "express"
import { addClothingItem , getWardrobe , getWardrobeSuggestions , getOccasionSuggestion} from "../controllers/wardrobe.controller.js"

const Router = express.Router()

Router.post("/add/item",addClothingItem)
Router.get("/get/wardrobe",getWardrobe)
Router.get("/get/suggestions",getWardrobeSuggestions)
Router.get('/api/suggestions/occasion', getOccasionSuggestion);

export default Router