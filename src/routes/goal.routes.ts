import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createGoal, deleteGoal, getGoalById, getGoals, updateGoal } from "../controllers/goal.controller";

const router =  express.Router();

router.post("/", authMiddleware, createGoal);
router.get("/", authMiddleware, getGoals);
router.get("/goal", authMiddleware, getGoalById);
router.put("/", authMiddleware, updateGoal);
router.delete("/", authMiddleware, deleteGoal);

export default router;