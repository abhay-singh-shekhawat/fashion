import { getOutfitSuggestion } from "../controllers/suggestion.controller.js";
import express from "express"

const Router = express.Router()

Router.get("/get/outfit-sugestions",getOutfitSuggestion);

export default Router