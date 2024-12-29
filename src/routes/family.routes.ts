import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { completeFamilyTask, createFamilyTasks, deleteFamily, deleteFamilyGoal, deleteFamilyTask, getAllFamilies, getFamily, getFamilyGoals, getFamilyLeaderboard, getFamilyMembers, getFamilyTaskById, getLeaderboard, updateFamily, updateFamilyGoal, updateFamilyTask } from "../controllers/family.controller";

const router =  express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllFamilies);
router.get("/getFamily", authMiddleware, getFamily);
router.get("/getFamilyMembers", authMiddleware, getFamilyMembers);
router.put("/", authMiddleware, updateFamily);
router.delete("/", authMiddleware, deleteFamily);

//routes for family goals
router.put("/goal", authMiddleware, updateFamilyGoal);
router.get("/goals", authMiddleware, getFamilyGoals);
router.delete("/goal", authMiddleware, deleteFamilyGoal);

//routes for family tasks
router.post("/goal/task", authMiddleware, createFamilyTasks);
router.put("/goal/task", authMiddleware, updateFamilyTask);
router.delete("/goal/task", authMiddleware, deleteFamilyTask);
router.get("/goal/task", authMiddleware, getFamilyTaskById);
router.put("/goal/completeTask", authMiddleware, completeFamilyTask);

//routes for families leaderboard
router.get("/leaderboard", authMiddleware, getLeaderboard);
router.get("/familyLeaderboard", authMiddleware, getFamilyLeaderboard);

export default router;