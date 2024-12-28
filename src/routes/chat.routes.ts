import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { sendMessage } from "../controllers/chat.controller";

const router =  express.Router();

router.post("/", authMiddleware, sendMessage);

export default router;