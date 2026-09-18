import express from "express";
import { getActivityLog } from "../controllers/activity.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const Router = express.Router();

Router.get("/log", authMiddleware, getActivityLog);

export default Router;
