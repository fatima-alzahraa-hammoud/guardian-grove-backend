import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createGoal, getGoals } from "../controllers/goal.controller";

const router =  express.Router();

router.post("/", authMiddleware, createGoal);
router.get("/", authMiddleware, getGoals);

export default router;