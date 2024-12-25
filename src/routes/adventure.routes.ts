import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createAdventure, deleteAdventure, getAdventureById, getAllAdventures, updateAdventure } from "../controllers/adventure.controller";

const router =  express.Router();

router.post("/", createAdventure);
router.get("/", authMiddleware, getAllAdventures);
router.get("/adventure", authMiddleware, getAdventureById);
router.put("/", authMiddleware, updateAdventure);
router.delete("/", authMiddleware, deleteAdventure);


export default router;