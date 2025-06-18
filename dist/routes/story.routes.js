"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const story_controller_1 = require("../controllers/story.controller");
const router = express_1.default.Router();
router.post("/", auth_middleware_1.authMiddleware, story_controller_1.createStory);
router.get("/", auth_middleware_1.authMiddleware, story_controller_1.getStories);
router.get("/story/:storyId", auth_middleware_1.authMiddleware, story_controller_1.getStoryById);
router.delete("/", auth_middleware_1.authMiddleware, story_controller_1.deleteStory);
router.put("/", auth_middleware_1.authMiddleware, story_controller_1.updateStory);
exports.default = router;
