import express from "express";
import { scanSkinTone, getSkinTone } from "../controllers/skinTone.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import upload from "../utils/uploads/multer.js";

const Router = express.Router();

Router.post("/scan", authMiddleware, upload.single("image"), scanSkinTone);
Router.get("/", authMiddleware, getSkinTone);

export default Router;