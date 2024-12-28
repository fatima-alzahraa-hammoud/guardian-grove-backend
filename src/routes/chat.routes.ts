import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { deleteChat, getChatById, getUserChats, sendMessage, startNewChat } from "../controllers/chat.controller";
//import { sendMessage } from "../controllers/chat.controller";

const router =  express.Router();

//router.post("/", authMiddleware, sendMessage);
router.post("/", authMiddleware, startNewChat);
router.put("/", authMiddleware, sendMessage);
router.get("/getChats", authMiddleware, getUserChats);
router.get("/chat", authMiddleware, getChatById);
router.delete("/", authMiddleware, deleteChat);

export default router;