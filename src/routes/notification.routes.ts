import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {deleteNotification, getNotificationById, getNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendNotification, updateNotification } from "../controllers/notification.controller";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/", authMiddleware, adminMiddleware, sendNotification);
router.delete("/", authMiddleware, deleteNotification);
router.put("/", authMiddleware, adminMiddleware, updateNotification);
router.post("/markAsRead", authMiddleware, markNotificationAsRead);
router.post("/markAllAsRead", authMiddleware, markAllNotificationsAsRead);
router.get("/notification", authMiddleware, getNotificationById);

export default router;