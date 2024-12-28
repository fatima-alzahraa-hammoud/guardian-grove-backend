import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAchievement, deleteAchievement, getAchievements, getLockedAchievements, getUnLockedAchievements, getUserAchievements, unlockAchievement, unlockFamilyAchievement, updateAchievement } from "../controllers/achievement.controller";
import { adminMiddleware } from "../middlewares/adminMiddleware";

const router =  express.Router();

router.get("/", authMiddleware, getAchievements);
router.get("/locked", authMiddleware, getLockedAchievements);
router.get("/user", authMiddleware, getUserAchievements);
router.post("/unlock", authMiddleware, unlockAchievement);
router.post("/", authMiddleware, createAchievement);
router.put("/", authMiddleware, adminMiddleware, updateAchievement);
router.delete("/", authMiddleware, adminMiddleware, deleteAchievement);
router.get("/unlocked", authMiddleware, getUnLockedAchievements);
router.post("/unlockFamilyAchievement", authMiddleware, unlockFamilyAchievement);


export default router;