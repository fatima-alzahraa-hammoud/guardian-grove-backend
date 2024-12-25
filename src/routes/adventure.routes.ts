import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAdventure, getAdventureById, getAllAdventures } from "../controllers/adventure.controller";

const router =  express.Router();

router.post("/", createAdventure);
router.get("/", authMiddleware, getAllAdventures);
router.get("/adventure", authMiddleware, getAdventureById);


export default router;