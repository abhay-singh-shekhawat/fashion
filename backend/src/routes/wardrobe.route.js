import express from "express"
import { addClothingItem , getWardrobe , getWardrobeSuggestions } from "../controllers/wardrobe.controller.js"

const Router = express.Router()

Router.post("/add/item",addClothingItem)
Router.get("/get/wardrobe",getWardrobe)
Router.get("/get/suggestions",getWardrobeSuggestions)

export default Router