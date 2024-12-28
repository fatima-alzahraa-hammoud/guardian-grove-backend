import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { createFamilyTasks, deleteFamily, deleteFamilyGoal, getAllFamilies, getFamily, getFamilyGoals, getFamilyMembers, updateFamily, updateFamilyGoal, updateFamilyTask } from "../controllers/family.controller";

const router =  express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllFamilies);
router.get("/getFamily", authMiddleware, getFamily);
router.get("/getFamilyMembers", authMiddleware, getFamilyMembers);
router.put("/", authMiddleware, updateFamily);
router.delete("/", authMiddleware, deleteFamily);
router.put("/goal", authMiddleware, updateFamilyGoal);
router.get("/goals", authMiddleware, getFamilyGoals);
router.delete("/goal", authMiddleware, deleteFamilyGoal);
router.post("/goal/task", authMiddleware, createFamilyTasks);
router.put("/goal/task", authMiddleware, updateFamilyTask);

export default router;