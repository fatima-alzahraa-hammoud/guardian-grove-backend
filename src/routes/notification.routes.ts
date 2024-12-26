import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNotification, deleteNotification, getNotifications, updateNotification } from "../controllers/notification.controller";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/", authMiddleware, createNotification);
router.delete("/", authMiddleware, deleteNotification);
router.put("/", authMiddleware, updateNotification);

export default router;