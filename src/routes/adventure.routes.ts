import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAdventure, getAllAdventures } from "../controllers/adventure.controller";

const router =  express.Router();

router.post("/", createAdventure);
router.get("/", authMiddleware, getAllAdventures);

export default router;