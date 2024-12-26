import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getAllAchievements } from "../controllers/achievement.controller";

const router =  express.Router();

router.get("/", authMiddleware, getAllAchievements);

export default router;