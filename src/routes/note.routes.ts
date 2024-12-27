import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNote, getNotes } from "../controllers/note.controller";

const router =  express.Router();

router.post("/", authMiddleware, createNote);
router.get("/", authMiddleware, getNotes);

export default router;