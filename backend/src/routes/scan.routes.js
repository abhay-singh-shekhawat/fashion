import express from "express"
import { scanOutfit } from "../controllers/scanner.controller.js"
import upload from "../utils/uploads/multer.js"
import {authMiddleware} from "../middlewares/auth.middleware.js"

const Router = express.Router()

Router.post("/outfit", authMiddleware , upload.single(`image`),scanOutfit)

export default Router