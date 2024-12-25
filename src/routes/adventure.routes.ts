import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAdventure, deleteAdventure, getAdventureById, getAllAdventures, updateAdventure } from "../controllers/adventure.controller";
import { createChallenge } from "../controllers/challenge.controller";

const router =  express.Router();

router.post("/", createAdventure);
router.get("/", authMiddleware, getAllAdventures);
router.get("/adventure", authMiddleware, getAdventureById);
router.put("/", authMiddleware, updateAdventure);
router.delete("/", authMiddleware, deleteAdventure);

router.post("/adventure/challenge", authMiddleware, createChallenge);

export default router;