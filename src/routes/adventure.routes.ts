import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAdventure, deleteAdventure, getAdventureById, getAllAdventures, updateAdventure } from "../controllers/adventure.controller";
import { createChallenge, getAllChallenges, getChallengeById, updateChallege } from "../controllers/challenge.controller";

const router =  express.Router();

router.post("/", createAdventure);
router.get("/", authMiddleware, getAllAdventures);
router.get("/adventure", authMiddleware, getAdventureById);
router.put("/", authMiddleware, updateAdventure);
router.delete("/", authMiddleware, deleteAdventure);

router.post("/adventure/challenges", authMiddleware, createChallenge);
router.get("/adventure/challenges", authMiddleware, getAllChallenges);
router.get("/adventure/challenges/challenge", authMiddleware, getChallengeById);


export default router;