import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { completeFamilyTask, createFamilyTasks, deleteFamily, deleteFamilyGoal, deleteFamilyTask, getAllFamilies, getFamily, getFamilyGoals, getFamilyLeaderboard, getFamilyMembers, getFamilyNameNbMembersStars, getFamilyProgressStats, getFamilyTaskById, getLeaderboard, updateAllFamilyMembersStars, updateFamily, updateFamilyGoal, updateFamilyTask } from "../controllers/family.controller";

const router =  express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllFamilies);
router.get("/getFamily", authMiddleware, getFamily);
router.get("/FamilyMembers", authMiddleware, getFamilyMembers);
router.get("/someFamilydetails", authMiddleware, getFamilyNameNbMembersStars);
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
router.get("/leaderboard/:familyId?", authMiddleware, getLeaderboard);
router.get("/familyLeaderboard", authMiddleware, getFamilyLeaderboard);


//routes for family stars
router.put("/stars", authMiddleware, updateAllFamilyMembersStars);

//routes for family stats
router.get("/familyProgressStats", authMiddleware, getFamilyProgressStats);

export default router;