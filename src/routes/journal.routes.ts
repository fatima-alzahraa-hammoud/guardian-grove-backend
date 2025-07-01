import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { journalUploadMiddleware } from "../middlewares/journal.middleware";
import { createJournalEntry } from "../controllers/journal.controller";

const router =  express.Router();

router.use(authMiddleware);

// Create a new journal entry
router.post("/", journalUploadMiddleware, createJournalEntry);

export default router;