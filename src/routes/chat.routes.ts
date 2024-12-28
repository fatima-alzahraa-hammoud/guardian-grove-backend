import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getUserChats, sendMessage, startNewChat } from "../controllers/chat.controller";
//import { sendMessage } from "../controllers/chat.controller";

const router =  express.Router();

//router.post("/", authMiddleware, sendMessage);
router.post("/", authMiddleware, startNewChat);
router.post("/send", authMiddleware, sendMessage);
router.get("/getChats", authMiddleware, getUserChats);

export default router;