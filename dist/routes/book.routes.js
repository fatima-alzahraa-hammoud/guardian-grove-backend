"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const book_controller_1 = require("../controllers/book.controller");
const bookUploadMiddleware_1 = require("../middlewares/bookUploadMiddleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.post('/upload', auth_middleware_1.authMiddleware, bookUploadMiddleware_1.bookUploadMiddleware, book_controller_1.uploadBook);
router.get('/', auth_middleware_1.authMiddleware, book_controller_1.getUserBooks);
router.delete('/', auth_middleware_1.authMiddleware, book_controller_1.deleteBook);
router.put('/:bookId/:userId?', auth_middleware_1.authMiddleware, bookUploadMiddleware_1.bookUploadMiddleware, book_controller_1.updateBook);
router.get('/download', auth_middleware_1.authMiddleware, book_controller_1.downloadBook);
exports.default = router;
