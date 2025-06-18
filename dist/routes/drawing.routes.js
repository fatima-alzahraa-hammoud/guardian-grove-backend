"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const drawing_controller_1 = require("../controllers/drawing.controller");
const imageUploadMiddleware_1 = require("../middlewares/imageUploadMiddleware");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authMiddleware, imageUploadMiddleware_1.imageUploadMiddleware, drawing_controller_1.createDrawing);
router.get("/", auth_middleware_1.authMiddleware, drawing_controller_1.getDrawings);
router.get("/drawing", auth_middleware_1.authMiddleware, drawing_controller_1.getDrawingById);
router.delete("/", auth_middleware_1.authMiddleware, drawing_controller_1.deleteDrawing);
router.put("/:userId/:drawingId", auth_middleware_1.authMiddleware, imageUploadMiddleware_1.imageUploadMiddleware, drawing_controller_1.updateDrawing);
exports.default = router;
