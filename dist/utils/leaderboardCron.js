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
const node_schedule_1 = __importDefault(require("node-schedule"));
const family_model_1 = require("../models/family.model"); // Adjust path based on your project structure
// Utility function to reset leaderboard fields
const resetLeaderboard = (starsField, tasksField, period) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield family_model_1.Family.updateMany({}, { [starsField]: 0, [tasksField]: 0 });
        console.log(`${period} leaderboard reset successfully.`);
    }
    catch (error) {
        console.error(`Failed to reset ${period} leaderboard:`, error);
    }
});
// Schedule Jobs
// Daily reset at midnight
node_schedule_1.default.scheduleJob('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield resetLeaderboard('stars.daily', 'taskCounts.daily', 'Daily');
}));
// Weekly reset at midnight (Sunday)
node_schedule_1.default.scheduleJob('0 0 * * 0', () => __awaiter(void 0, void 0, void 0, function* () {
    yield resetLeaderboard('stars.weekly', 'taskCounts.weekly', 'Weekly');
}));
// Monthly reset at midnight (1st day of each month)
node_schedule_1.default.scheduleJob('0 0 1 * *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield resetLeaderboard('stars.monthly', 'taskCounts.monthly', 'Monthly');
}));
// Yearly reset at midnight (1st January)
node_schedule_1.default.scheduleJob('0 0 1 1 *', () => __awaiter(void 0, void 0, void 0, function* () {
    yield resetLeaderboard('stars.yearly', 'taskCounts.yearly', 'Yearly');
}));
