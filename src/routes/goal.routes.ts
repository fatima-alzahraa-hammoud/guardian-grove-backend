import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createGoal, createTask, deleteGoal, getGoalById, getGoals, getTaskById, updateGoal } from "../controllers/goal.controller";

const router =  express.Router();

router.post("/", authMiddleware, createGoal);
router.get("/", authMiddleware, getGoals);
router.get("/goal", authMiddleware, getGoalById);
router.put("/", authMiddleware, updateGoal);
router.delete("/", authMiddleware, deleteGoal);

//routes for tasks
router.post("/task", authMiddleware, createTask);
router.get("/task", authMiddleware, getTaskById);

export default router;