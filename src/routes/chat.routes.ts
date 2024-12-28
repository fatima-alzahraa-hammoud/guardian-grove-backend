import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { startNewChat } from "../controllers/chat.controller";
//import { sendMessage } from "../controllers/chat.controller";

const router =  express.Router();

//router.post("/", authMiddleware, sendMessage);
router.post("/", authMiddleware, startNewChat);

export default router;