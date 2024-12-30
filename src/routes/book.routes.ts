import express from "express";
import { uploadBook } from "../controllers/book.controller";
import { bookUploadMiddleware } from "../middlewares/bookUploadMiddleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router =  express.Router();

router.post('/upload', authMiddleware, bookUploadMiddleware, uploadBook);

export default router;