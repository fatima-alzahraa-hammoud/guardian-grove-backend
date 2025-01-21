import express from "express";
import { deleteBook, downloadBook, getUserBooks, updateBook, uploadBook } from "../controllers/book.controller";
import { bookUploadMiddleware } from "../middlewares/bookUploadMiddleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router =  express.Router();

router.post('/upload', authMiddleware, bookUploadMiddleware, uploadBook);
router.get('/', authMiddleware, getUserBooks);
router.delete('/', authMiddleware, deleteBook);
router.put('/:bookId/:userId?', authMiddleware, bookUploadMiddleware, updateBook);
router.get('/download', authMiddleware, downloadBook);

export default router;