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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompletedTasks = void 0;
const family_model_1 = require("../../models/family.model");
const user_model_1 = require("../../models/user.model");
const getCompletedTasks = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.findById(userId).populate('goals');
    if (!user) {
        throw new Error("User not found");
    }
    let goals = user.goals;
    const family = yield family_model_1.Family.findById(user.familyId).populate('goals');
    if (family) {
        goals = [...goals, ...family.goals];
    }
    // Filter out completed tasks from the user's goals and family goals
    const completedTasks = goals.flatMap(goal => goal.tasks.filter(task => task.isCompleted));
    return completedTasks;
});
exports.getCompletedTasks = getCompletedTasks;
