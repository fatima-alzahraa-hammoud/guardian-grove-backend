import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNotification, deleteNotification, getNotifications } from "../controllers/notification.controller";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/", authMiddleware, createNotification);
router.delete("/", authMiddleware, deleteNotification);

export default router;