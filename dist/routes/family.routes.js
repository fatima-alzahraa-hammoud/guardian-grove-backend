"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const adminMiddleware_1 = require("../middlewares/adminMiddleware");
const family_controller_1 = require("../controllers/family.controller");
const router = express_1.default.Router();
router.get("/", auth_middleware_1.authMiddleware, adminMiddleware_1.adminMiddleware, family_controller_1.getAllFamilies);
router.post("/getFamily", auth_middleware_1.authMiddleware, family_controller_1.getFamily);
router.get("/FamilyMembers", auth_middleware_1.authMiddleware, family_controller_1.getFamilyMembers);
router.get("/someFamilydetails", auth_middleware_1.authMiddleware, family_controller_1.getFamilyNameNbMembersStars);
router.put("/", auth_middleware_1.authMiddleware, family_controller_1.updateFamily);
router.delete("/", auth_middleware_1.authMiddleware, family_controller_1.deleteFamily);
//routes for family goals
router.put("/goal", auth_middleware_1.authMiddleware, family_controller_1.updateFamilyGoal);
router.get("/goals", auth_middleware_1.authMiddleware, family_controller_1.getFamilyGoals);
router.delete("/goal", auth_middleware_1.authMiddleware, family_controller_1.deleteFamilyGoal);
//routes for family tasks
router.post("/goal/task", auth_middleware_1.authMiddleware, family_controller_1.createFamilyTasks);
router.put("/goal/task", auth_middleware_1.authMiddleware, family_controller_1.updateFamilyTask);
router.delete("/goal/task", auth_middleware_1.authMiddleware, family_controller_1.deleteFamilyTask);
router.get("/goal/task", auth_middleware_1.authMiddleware, family_controller_1.getFamilyTaskById);
router.put("/goal/completeTask", auth_middleware_1.authMiddleware, family_controller_1.completeFamilyTask);
//routes for families leaderboard
router.get("/leaderboard/:familyId?", auth_middleware_1.authMiddleware, family_controller_1.getLeaderboard);
router.get("/familyLeaderboard", auth_middleware_1.authMiddleware, family_controller_1.getFamilyLeaderboard);
//routes for family stars
router.put("/stars", auth_middleware_1.authMiddleware, family_controller_1.updateAllFamilyMembersStars);
//routes for family stats
router.post("/familyProgressStats", auth_middleware_1.authMiddleware, family_controller_1.getFamilyProgressStats);
exports.default = router;
