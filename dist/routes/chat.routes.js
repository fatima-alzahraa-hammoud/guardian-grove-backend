"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const chat_controller_1 = require("../controllers/chat.controller");
//import { sendMessage } from "../controllers/chat.controller";
const router = express_1.default.Router();
router.post("/handle", auth_middleware_1.authMiddleware, chat_controller_1.handleChat);
router.post("/", auth_middleware_1.authMiddleware, chat_controller_1.startNewChat);
router.get("/getChats", auth_middleware_1.authMiddleware, chat_controller_1.getUserChatsOrCreate);
router.get("/chat", auth_middleware_1.authMiddleware, chat_controller_1.getChatById);
router.delete("/", auth_middleware_1.authMiddleware, chat_controller_1.deleteChat);
router.put("/rename", auth_middleware_1.authMiddleware, chat_controller_1.renameChat);
exports.default = router;
