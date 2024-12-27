import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNote, getNotes, updateNote } from "../controllers/note.controller";

const router =  express.Router();

router.post("/", authMiddleware, createNote);
router.get("/", authMiddleware, getNotes);
router.put("/", authMiddleware, updateNote);

export default router;