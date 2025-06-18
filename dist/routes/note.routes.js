"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const note_controller_1 = require("../controllers/note.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authMiddleware, note_controller_1.createNote);
router.get("/", auth_middleware_1.authMiddleware, note_controller_1.getNotes);
router.put("/", auth_middleware_1.authMiddleware, note_controller_1.updateNote);
router.delete("/", auth_middleware_1.authMiddleware, note_controller_1.deleteNote);
exports.default = router;
