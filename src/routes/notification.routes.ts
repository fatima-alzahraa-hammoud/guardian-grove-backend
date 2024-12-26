import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getNotifications } from "../controllers/notification.controller";

const router =  express.Router();

router.get("/", authMiddleware, getNotifications);

export default router;