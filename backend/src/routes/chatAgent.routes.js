import { agenticChat } from "../controllers/agenticChat.controller.js";
import express from "express"

const Router = express.Router()

Router.post("/chat",agenticChat)

export default Router