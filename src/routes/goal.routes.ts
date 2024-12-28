import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { completeTask, createGoal, createTask, deleteGoal, deleteTask, getGoalById, getGoals, getTaskById, updateFamilyGoal, updateTask, updateUserGoal } from "../controllers/goal.controller";

const router =  express.Router();

//routes for goals
router.post("/", authMiddleware, createGoal);
router.get("/", authMiddleware, getGoals);
router.get("/goal", authMiddleware, getGoalById);
router.put("/", authMiddleware, updateUserGoal);
router.delete("/", authMiddleware, deleteGoal);
router.put("/family", authMiddleware, updateFamilyGoal);

//routes for tasks
router.post("/task", authMiddleware, createTask);
router.get("/task", authMiddleware, getTaskById);
router.put("/task", authMiddleware, updateTask);
router.delete("/task", authMiddleware, deleteTask);
router.post("/taskDone", authMiddleware, completeTask);

export default router;