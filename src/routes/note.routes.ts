import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNote, deleteNote, getNotes, updateNote } from "../controllers/note.controller";
import { generateNoteAIResponse } from "../controllers/ai.controller";

const router =  express.Router();

router.post("/", authMiddleware, createNote);
router.get("/", authMiddleware, getNotes);
router.put("/", authMiddleware, updateNote);
router.delete("/", authMiddleware, deleteNote);
router.post("/askChat", authMiddleware, generateNoteAIResponse)

export default router;