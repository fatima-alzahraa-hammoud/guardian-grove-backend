import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { deleteFamily, getAllFamilies, getFamily, getFamilyMembers, updateFamily } from "../controllers/family.controller";

const router =  express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllFamilies);
router.get("/getFamily", authMiddleware, getFamily);
router.get("/getFamilyMembers", authMiddleware, getFamilyMembers);
router.put("/", authMiddleware, updateFamily);
router.delete("/", authMiddleware, deleteFamily);

export default router;