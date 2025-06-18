"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_controller_1 = require("../controllers/users.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const ai_controller_1 = require("../controllers/ai.controller");
const router = express_1.default.Router();
router.get("/", auth_middleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, users_controller_1.getUsers);
router.get("/user", auth_middleware_1.authMiddleware, users_controller_1.getUserById);
router.post("/", auth_middleware_1.authMiddleware, users_controller_1.createUser);
router.put("/", auth_middleware_1.authMiddleware, users_controller_1.editUserProfile);
router.delete("/", auth_middleware_1.authMiddleware, users_controller_1.deleteUser);
router.put("/updatePassword", auth_middleware_1.authMiddleware, users_controller_1.updatePassword);
// Routes for managing user's stars
router.get("/stars", auth_middleware_1.authMiddleware, users_controller_1.getUserStars);
router.put("/stars", auth_middleware_1.authMiddleware, users_controller_1.updateUserStars);
// Routes for managing user's coins
router.get("/coins", auth_middleware_1.authMiddleware, users_controller_1.getUserCoins);
router.put("/coins", auth_middleware_1.authMiddleware, users_controller_1.updateUserCoins);
// Routes for managing user's location
router.get("/location", auth_middleware_1.authMiddleware, users_controller_1.getLocation);
router.put("/location", auth_middleware_1.authMiddleware, users_controller_1.updateLocation);
// Routes for managing user's rank 
router.get("/rank", auth_middleware_1.authMiddleware, users_controller_1.getUserRank);
//router.put("/rank", authMiddleware, updateUserRank); 
// Routes for user's interests 
router.get("/interests", auth_middleware_1.authMiddleware, users_controller_1.getUserInterests);
// Routes for user's adventures 
router.post("/adventure", auth_middleware_1.authMiddleware, users_controller_1.startAdventure);
router.post("/adventure/challenge", auth_middleware_1.authMiddleware, users_controller_1.completeChallenge);
router.get("/adventures", auth_middleware_1.authMiddleware, users_controller_1.getUserAdventures);
// Routes for user's purchased items 
router.get("/purchasedItems", auth_middleware_1.authMiddleware, users_controller_1.getUserPurchasedItems);
// Routes for user's avatar 
router.get("/user/avatar", auth_middleware_1.authMiddleware, users_controller_1.getUserAvatar);
// routes for generate AI
router.post("/generateGoals", ai_controller_1.regenerateGoalsAndTasksRoute);
router.post("/generatePlan", ai_controller_1.generateGrowthPlans);
router.post("/generateLearningZone", ai_controller_1.generateLearningZone);
router.post("/generateTrackDay", ai_controller_1.generateTrackDay);
router.post("/generateStory", ai_controller_1.generateStory);
router.post("/generateViewTasks", ai_controller_1.generateViewTasks);
router.post("/generateQuickTip", ai_controller_1.generateQuickTips);
router.post("/generateQusetion", ai_controller_1.generateTaskCompletionQuestion);
router.post("/checkAnswer", ai_controller_1.checkQuestionCompletion);
router.post("/generateAdventure", ai_controller_1.generateDailyAdventure);
exports.default = router;
