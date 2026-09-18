import {register , login, updateMe, forgotPassword, resetPassword} from "../controllers/auth.controller.js"
import {authMiddleware} from "../middlewares/auth.middleware.js"
import express from "express"

const Router = express.Router()

Router.post("/register",register)
Router.post("/login",login)

/* Account edits and the password-reset pair. The reset routes are public by
   design: the whole point is being locked out. */
Router.put("/me", authMiddleware, updateMe)
Router.post("/forgot-password", forgotPassword)
Router.post("/reset-password", resetPassword)

export default Router
