import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {deleteNotification, getNotificationById, getNotifications, markAllNotificationsAsRead, markNotificationAsDone, sendNotification, sendSharedNotification, updateNotification } from "../controllers/notification.controller";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/", authMiddleware, adminMiddleware, sendNotification);
router.delete("/", authMiddleware, deleteNotification);
router.put("/", authMiddleware, adminMiddleware, updateNotification);
router.post("/markAsDone", authMiddleware, markNotificationAsDone);
router.post("/sendShared", authMiddleware, adminMiddleware, sendSharedNotification);
router.post("/markAllAsRead", authMiddleware, markAllNotificationsAsRead);
router.get("/notification", authMiddleware, getNotificationById);

export default router;