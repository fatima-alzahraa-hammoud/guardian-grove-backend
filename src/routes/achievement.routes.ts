import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAchievement, deleteAchievement, getAllAchievements, getLockedAchievements, getUserAchievements, unlockAchievement, updateAchievement } from "../controllers/achievement.controller";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router =  express.Router();

router.get("/", authMiddleware, getAllAchievements);
router.get("/locked", authMiddleware, getLockedAchievements);
router.get("/unlocked", authMiddleware, getUserAchievements);
router.post("/unlock", authMiddleware, unlockAchievement);
router.post("/", authMiddleware, createAchievement);
router.put("/", authMiddleware, adminMiddleware, updateAchievement);
router.delete("/", authMiddleware, adminMiddleware, deleteAchievement);

export default router;