import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { journalUploadMiddleware } from "../middlewares/journal.middleware";
import { createJournalEntry, deleteJournalEntry, getJournalEntries, getJournalEntriesByType, getJournalEntriesByUser, getJournalEntryById, updateJournalEntry } from "../controllers/journal.controller";

const router =  express.Router();

router.use(authMiddleware);

// Create a new journal entry
router.post("/", journalUploadMiddleware, createJournalEntry);
router.get("/", getJournalEntries);
router.get("/entry", getJournalEntryById);
router.put("/", journalUploadMiddleware, updateJournalEntry);
router.delete("/", deleteJournalEntry);
router.get("/type", getJournalEntriesByType);
router.get("/user", getJournalEntriesByUser);

export default router;