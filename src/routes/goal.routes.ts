import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createGoal } from "../controllers/goal.controller";

const router =  express.Router();

router.post("/", authMiddleware, createGoal);

export default router;