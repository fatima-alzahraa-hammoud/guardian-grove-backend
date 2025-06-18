"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const goal_controller_1 = require("../controllers/goal.controller");
const router = express_1.default.Router();
//routes for goals
router.post("/", auth_middleware_1.authMiddleware, goal_controller_1.createGoal);
router.post("/goals", auth_middleware_1.authMiddleware, goal_controller_1.getGoals);
router.get("/goal", auth_middleware_1.authMiddleware, goal_controller_1.getGoalById);
router.put("/", auth_middleware_1.authMiddleware, goal_controller_1.updateUserGoal);
router.delete("/", auth_middleware_1.authMiddleware, goal_controller_1.deleteGoal);
//routes for tasks
router.post("/task", auth_middleware_1.authMiddleware, goal_controller_1.createUserTask);
router.get("/task", auth_middleware_1.authMiddleware, goal_controller_1.getTaskById);
router.put("/task", auth_middleware_1.authMiddleware, goal_controller_1.updateTask);
router.delete("/task", auth_middleware_1.authMiddleware, goal_controller_1.deleteTask);
router.post("/taskDone", auth_middleware_1.authMiddleware, goal_controller_1.completeTask);
router.get("/monthlyStats", auth_middleware_1.authMiddleware, goal_controller_1.getMonthlyStats);
exports.default = router;
