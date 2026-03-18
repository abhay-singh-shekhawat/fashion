import express from "express"
import { scanOutfit } from "../controllers/scanner.controller.js"
import upload from "../utils/uploads/multer.js"

const Router = express.Router()

Router.post("/outfit",upload.single(`image`),scanOutfit)

export default Router