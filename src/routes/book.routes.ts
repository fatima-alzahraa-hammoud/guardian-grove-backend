import express from "express";
import { deleteBook, getUserBooks, updateBook, uploadBook } from "../controllers/book.controller";
import { bookUploadMiddleware } from "../middlewares/bookUploadMiddleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router =  express.Router();

router.post('/upload', authMiddleware, bookUploadMiddleware, uploadBook);
router.get('/', authMiddleware, getUserBooks);
router.delete('/', authMiddleware, deleteBook);
router.put('/:bookId/:userId?', bookUploadMiddleware, authMiddleware, updateBook);

export default router;