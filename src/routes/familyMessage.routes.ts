import express from "express";
import { getFamilyChats, createGroupChat, getChatMessages, sendMessage, markMessagesAsRead, editMessage, deleteMessage, addReaction, createOrGetDirectChat } from "../controllers/message.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { imageUploadMiddleware } from "../middlewares/imageUploadMiddleware";

const router = express.Router();

// Chat management routes
router.get("/", authMiddleware, getFamilyChats);
router.post("/group", authMiddleware, createGroupChat);
router.post("/chats/direct", authMiddleware, createOrGetDirectChat);

// Message routes
router.get("/:chatId/messages", authMiddleware, getChatMessages);
router.post("/:chatId/messages", authMiddleware, imageUploadMiddleware, sendMessage);
router.put("/:chatId/read", authMiddleware, markMessagesAsRead);

// Message management routes
router.put("/messages/:messageId", authMiddleware, editMessage);
router.delete("/messages/:messageId", authMiddleware, deleteMessage);
router.post("/messages/:messageId/reactions", authMiddleware, addReaction);

export default router;