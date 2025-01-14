import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { deleteChat, getChatById, getUserChatsOrCreate, handleChat, renameChat, sendMessage, startNewChat } from "../controllers/chat.controller";
//import { sendMessage } from "../controllers/chat.controller";

const router =  express.Router();

router.post("/handle", authMiddleware, handleChat);
router.post("/", authMiddleware, startNewChat);
router.put("/", authMiddleware, sendMessage);
router.get("/getChats", authMiddleware, getUserChatsOrCreate);
router.get("/chat", authMiddleware, getChatById);
router.delete("/", authMiddleware, deleteChat);
router.put("/rename", authMiddleware, renameChat);

export default router;