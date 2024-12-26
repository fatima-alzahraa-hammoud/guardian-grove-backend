import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getAllAchievements, getLockedAchievements } from "../controllers/achievement.controller";

const router =  express.Router();

router.get("/", authMiddleware, getAllAchievements);
router.get("/locked", authMiddleware, getLockedAchievements);

export default router;