import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createNote } from "../controllers/note.controller";

const router =  express.Router();

router.post("/", authMiddleware, createNote);

export default router;