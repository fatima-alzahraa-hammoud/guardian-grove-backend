import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {deleteNotification, getNotifications, markNotificationAsDone, sendNotification, sendSharedNotification, updateNotification } from "../controllers/notification.controller";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/", authMiddleware, adminMiddleware, sendNotification);
router.delete("/", authMiddleware, deleteNotification);
router.put("/", authMiddleware, adminMiddleware, updateNotification);
router.post("/markAsDone", authMiddleware, markNotificationAsDone);
router.post("/sendShared", authMiddleware, adminMiddleware, sendSharedNotification);

export default router;