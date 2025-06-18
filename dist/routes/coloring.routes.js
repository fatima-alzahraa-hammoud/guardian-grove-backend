"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const imageUploadMiddleware_1 = require("../middlewares/imageUploadMiddleware");
const coloring_controller_1 = require("../controllers/coloring.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authMiddleware, imageUploadMiddleware_1.imageUploadMiddleware, coloring_controller_1.createColoring);
router.get("/", auth_middleware_1.authMiddleware, coloring_controller_1.getColorings);
router.get("/coloring", auth_middleware_1.authMiddleware, coloring_controller_1.getColoringById);
router.delete("/", auth_middleware_1.authMiddleware, coloring_controller_1.deleteColoring);
router.put("/:userId/:coloringId", auth_middleware_1.authMiddleware, imageUploadMiddleware_1.imageUploadMiddleware, coloring_controller_1.updateColoring);
exports.default = router;
