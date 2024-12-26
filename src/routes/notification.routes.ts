import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNotification, deleteNotification, getNotifications, updateNotification } from "../controllers/notification.controller";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);
router.post("/", authMiddleware, adminMiddleware, createNotification);
router.delete("/", authMiddleware, deleteNotification);
router.put("/", authMiddleware, adminMiddleware, updateNotification);

export default router;