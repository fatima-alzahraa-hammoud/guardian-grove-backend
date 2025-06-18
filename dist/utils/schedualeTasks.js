"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const user_model_1 = require("../models/user.model");
const ai_controller_1 = require("../controllers/ai.controller");
// Run daily at midnight
node_cron_1.default.schedule("0 8 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running scheduled task to regenerate goals and tasks...");
    try {
        // Fetch all users
        const users = yield user_model_1.User.find();
        for (const user of users) {
            // Check if user has goals
            const hasGoals = user.goals && user.goals.length > 0;
            // Check if all goals are completed
            const allGoalsCompleted = hasGoals && user.goals.every(goal => goal.isCompleted);
            // Regenerate goals if there are no goals or all goals are completed
            if (!hasGoals || allGoalsCompleted) {
                console.log(`Regenerating goals for user: ${user._id}`);
                yield (0, ai_controller_1.regenerateGoalsAndTasks)(user._id.toString());
            }
            else {
                console.log(`Skipping regeneration for user: ${user._id}`);
            }
        }
    }
    catch (error) {
        console.error("Error in scheduled task:", error);
    }
}));
node_cron_1.default.schedule("0 9 * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.User.find();
    for (const user of users) {
        const message = yield (0, ai_controller_1.generateDailyMessage)(user._id.toString());
    }
    console.log("Daily messages sent successfully.");
}));
