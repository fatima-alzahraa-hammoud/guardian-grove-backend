import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAchievement, getAllAchievements, getLockedAchievements, unlockAchievement } from "../controllers/achievement.controller";

const router =  express.Router();

router.get("/", authMiddleware, getAllAchievements);
router.get("/locked", authMiddleware, getLockedAchievements);
router.get("/unlocked", authMiddleware, getLockedAchievements);
router.post("/unlock", authMiddleware, unlockAchievement);
router.post("/", authMiddleware, createAchievement);


export default router;