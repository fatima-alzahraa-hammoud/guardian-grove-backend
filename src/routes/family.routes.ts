import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/adminMiddleware";
import { getAllFamilies } from "../controllers/family.controller";

const router =  express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllFamilies);

export default router;