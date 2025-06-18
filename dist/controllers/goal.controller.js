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
exports.getMonthlyStats = exports.completeTask = exports.deleteTask = exports.updateTask = exports.getTaskById = exports.createUserTask = exports.deleteGoal = exports.updateUserGoal = exports.getGoalById = exports.getGoals = exports.createGoal = void 0;
const user_model_1 = require("../models/user.model");
const checkId_1 = require("../utils/checkId");
const error_1 = require("../utils/error");
const achievements_model_1 = require("../models/achievements.model");
const family_model_1 = require("../models/family.model");
const date_fns_1 = require("date-fns");
const recalculateFamilyMemberRanks_1 = require("../utils/recalculateFamilyMemberRanks");
//API to create goal
const createGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { familyId, userId, title, description, type, dueDate, rewards } = req.body;
        if (!title || !description) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        if (!type) {
            type = 'personal';
        }
        if (rewards === null || rewards === void 0 ? void 0 : rewards.achievementId) {
            const achievement = yield achievements_model_1.Achievement.findById(rewards.achievementId);
            if (!achievement) {
                return (0, error_1.throwError)({ message: "Achievement not found.", res, status: 404 });
            }
            rewards.achievementName = achievement.title;
        }
        const newGoal = ({
            title,
            description,
            type,
            dueDate,
            rewards,
            tasks: [],
            createdAt: new Date()
        });
        if (type === "personal") {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
            const updatedUser = yield user_model_1.User.findOneAndUpdate({ _id: userId }, { $push: { goals: newGoal } }, { new: true });
            if (!updatedUser) {
                return (0, error_1.throwError)({ message: "Failed to update user goals.", res, status: 500 });
            }
        }
        else {
            if (!(0, checkId_1.checkId)({ id: familyId, res }))
                return;
            const family = yield family_model_1.Family.findById({ _id: familyId });
            if (!family) {
                return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
            }
            const updatedFamily = yield family_model_1.Family.findOneAndUpdate({ _id: familyId }, { $push: { goals: newGoal } }, { new: true });
            if (!updatedFamily) {
                return (0, error_1.throwError)({ message: "Failed to update family goals.", res, status: 500 });
            }
        }
        res.status(201).json({ message: 'Goal created successfully', goal: newGoal });
    }
    catch (err) {
        console.error("Error creating goal:", err);
        return (0, error_1.throwError)({ message: "An unknown error occurred while creating goal", res, status: 500 });
    }
});
exports.createGoal = createGoal;
//API to get goals of the user/users
const getGoals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
            let goals = user.goals;
            const family = yield family_model_1.Family.findById(user.familyId).populate('goals');
            if (family) {
                goals = [...goals, ...family.goals];
            }
            res.status(200).json({ message: "Retrieving user goals successfully", goals: goals });
            return;
        }
        if (!req.user || req.user.role !== 'admin') {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const families = yield family_model_1.Family.find().populate('goals');
        const users = yield user_model_1.User.find();
        if (!users || users.length === 0) {
            return (0, error_1.throwError)({ message: "No users in the database", res, status: 404 });
        }
        const allGoals = users.map(user => {
            var _a;
            const familyGoals = ((_a = families.find(family => { var _a; return family._id.toString() === ((_a = user.familyId) === null || _a === void 0 ? void 0 : _a.toString()); })) === null || _a === void 0 ? void 0 : _a.goals) || [];
            return {
                userId: user._id,
                goals: [...user.goals, ...familyGoals],
            };
        });
        res.status(200).json({ message: "Retrieving all users' goals successfully", goals: allGoals });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error retrieving goals", res, status: 500 });
    }
});
exports.getGoals = getGoals;
//API to get Goal of specific Id
const getGoalById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { userId, goalId } = req.body;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        let user;
        if (userId && ['parent', 'admin', 'owner'].includes(req.user.role)) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
        }
        else {
            user = req.user;
        }
        let goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            const family = yield family_model_1.Family.findById(user.familyId).populate('goals');
            if (!family) {
                return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
            }
            goal = family.goals.find(goal => goal._id.toString() === goalId);
            if (!goal)
                return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        }
        res.status(200).json({ message: "Retrieving your goal successfully", goal: goal });
    }
    catch (err) {
        return (0, error_1.throwError)({ message: "Error retrieving goal", res, status: 500 });
    }
});
exports.getGoalById = getGoalById;
//API to update goal for personal goals
const updateUserGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { userId, goalId, title, description, type, dueDate, rewards } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        }
        if (rewards === null || rewards === void 0 ? void 0 : rewards.achievementId) {
            const achievement = yield achievements_model_1.Achievement.findById(rewards.achievementId);
            if (!achievement) {
                return (0, error_1.throwError)({ message: "Achievement not found.", res, status: 404 });
            }
            rewards.achievementName = achievement.title;
        }
        goal.title = title || goal.title;
        goal.description = description || goal.description;
        goal.type = type || goal.type;
        goal.dueDate = dueDate || goal.dueDate;
        if (rewards) {
            goal.rewards.stars = rewards.stars || goal.rewards.stars;
            goal.rewards.coins = rewards.coins || goal.rewards.coins;
            goal.rewards.achievementName = rewards.achievementName || goal.rewards.achievementName;
            goal.rewards.achievementId = rewards.achievementId || goal.rewards.achievementId;
        }
        yield user.save();
        res.status(200).json({ message: "Goal updated", goal });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error updating goal", res, status: 500 });
    }
});
exports.updateUserGoal = updateUserGoal;
//API to delete goal
const deleteGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { userId, goalId } = req.body;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goalIndex = user.goals.findIndex((goal) => goal._id.toString() === goalId);
        if (goalIndex === -1) {
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        }
        const [deletedGoal] = user.goals.splice(goalIndex, 1);
        yield user.save();
        res.status(200).json({ message: 'Goal deleted successfully', DeletedGoal: deletedGoal });
    }
    catch (error) {
        console.error("Error deleting goal:", error);
        return (0, error_1.throwError)({ message: "Error deleting goal", res, status: 500 });
    }
});
exports.deleteGoal = deleteGoal;
// API to create task for personal goals
const createUserTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, goalId, title, description, rewards } = req.body;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        if (!title || !description) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const type = goal.type;
        const newTask = {
            title,
            description,
            type,
            rewards: rewards || { stars: 2, coins: 1 },
            createdAt: new Date()
        };
        if (goal.isCompleted) {
            goal.isCompleted = false;
            let stars = goal.rewards.stars;
            user.stars -= goal.rewards.stars;
            user.coins -= goal.rewards.coins;
            if (user.familyId) {
                yield family_model_1.Family.findByIdAndUpdate(user.familyId, {
                    $inc: { totalStars: stars * -1 }
                });
                yield (0, recalculateFamilyMemberRanks_1.recalculateFamilyMemberRanks)(user.familyId, user);
            }
        }
        goal.tasks.push(newTask);
        yield user.save();
        res.status(201).json({ message: 'Task created successfully', Task: newTask });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while creating Task.", res, status: 500 });
    }
});
exports.createUserTask = createUserTask;
//API to get task by id
const getTaskById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, taskId, goalId } = req.body;
        if (!(0, checkId_1.checkId)({ id: taskId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return (0, error_1.throwError)({ message: "Task not found", res, status: 404 });
        }
        res.status(201).json({ message: 'Retrieve task successfully', Task: task });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while getting task.", res, status: 500 });
    }
});
exports.getTaskById = getTaskById;
// API to update task
const updateTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, taskId, goalId, title, description, type, rewards } = req.body;
        if (!(0, checkId_1.checkId)({ id: taskId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return (0, error_1.throwError)({ message: "Task not found", res, status: 404 });
        }
        task.title = title || task.title;
        task.description = description || task.description;
        task.type = type || task.type;
        if (rewards) {
            task.rewards.stars = rewards.stars || task.rewards.stars;
            task.rewards.coins = rewards.coins || task.rewards.coins;
        }
        yield user.save();
        res.status(200).json({ message: "Task updated successfully", task });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while update task.", res, status: 500 });
    }
});
exports.updateTask = updateTask;
//API to delete task
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { userId, goalId, taskId } = req.body;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: taskId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        const taskIndex = goal.tasks.findIndex((task) => task._id.toString() === taskId);
        if (taskIndex === -1) {
            return (0, error_1.throwError)({ message: "Task not found", res, status: 404 });
        }
        const [deletedTask] = goal.tasks.splice(taskIndex, 1);
        yield user.save();
        res.status(200).json({ message: 'Task deleted successfully', DeletedTask: deletedTask });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error deleting task", res, status: 500 });
    }
});
exports.deleteTask = deleteTask;
//API to complete task
const completeTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, goalId, taskId } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }) || !(0, checkId_1.checkId)({ id: goalId, res }) || !(0, checkId_1.checkId)({ id: taskId, res })) {
            return;
        }
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        }
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return (0, error_1.throwError)({ message: "Task not found", res, status: 404 });
        }
        // Mark the task as completed
        if (task.isCompleted) {
            return (0, error_1.throwError)({ message: "Task already completed", res, status: 400 });
        }
        task.isCompleted = true;
        let starsTaskReward = task.rewards.stars;
        user.coins += task.rewards.coins;
        user.stars += starsTaskReward;
        user.nbOfTasksCompleted += 1;
        goal.nbOfTasksCompleted += 1;
        let starsGoalReward = 0;
        goal.progress = (goal.tasks.filter(task => task.isCompleted).length / goal.tasks.length) * 100;
        // Check if all tasks in the goal are completed
        if (goal.progress === 100) {
            goal.isCompleted = true;
            goal.completedAt = new Date();
            starsGoalReward = goal.rewards.stars;
            // Reward user with coins and stars
            user.coins += goal.rewards.coins;
            user.stars += starsGoalReward;
            // Unlock Achievement if available
            if (goal.rewards.achievementId) {
                const achievement = yield achievements_model_1.Achievement.findById(goal.rewards.achievementId);
                if (!achievement) {
                    return (0, error_1.throwError)({ message: "Achievement not found", res, status: 404 });
                }
                user.achievements.push({ achievementId: achievement._id, unlockedAt: new Date(), });
                res.status(200).json({ message: "Achievement unlocked successfully", achievement });
            }
        }
        // Update the family total stars
        if (user.familyId) {
            const totalStars = starsTaskReward + starsGoalReward;
            yield family_model_1.Family.findByIdAndUpdate(user.familyId, {
                $inc: { totalStars: totalStars, tasks: 1 },
            });
            yield (0, recalculateFamilyMemberRanks_1.recalculateFamilyMemberRanks)(user.familyId, user);
        }
        yield user.save();
        res.status(200).json({ message: "Task marked as done", task, goal });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error marking task as done", res, status: 500 });
    }
});
exports.completeTask = completeTask;
//API to get monthly stats for goals and tasks for user
const getMonthlyStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const targetUserId = userId || req.user._id;
        if (!(0, checkId_1.checkId)({ id: targetUserId, res }))
            return;
        const isAuthorized = req.user._id.toString() === targetUserId.toString() || ['parent', 'admin', 'owner'].includes(req.user.role);
        if (!isAuthorized) {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
        }
        // Get the start and end dates of the current month
        const startOfCurrentMonth = (0, date_fns_1.startOfMonth)(new Date());
        const endOfCurrentMonth = (0, date_fns_1.endOfMonth)(new Date());
        // Retrieve the user and filter tasks/goals for the current month
        const user = yield user_model_1.User.findById(targetUserId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const tasksForCurrentMonth = user.goals.flatMap(goal => goal.tasks.filter(task => task.createdAt &&
            task.createdAt >= startOfCurrentMonth &&
            task.createdAt <= endOfCurrentMonth));
        const completedTasksForCurrentMonth = tasksForCurrentMonth.filter(task => task.isCompleted);
        const goalsForCurrentMonth = user.goals.filter(goal => goal.createdAt >= startOfCurrentMonth && goal.createdAt <= endOfCurrentMonth);
        const completedGoalsForCurrentMonth = goalsForCurrentMonth.filter(goal => goal.isCompleted);
        // Return stats
        res.status(200).json({
            totalTasks: tasksForCurrentMonth.length,
            completedTasks: completedTasksForCurrentMonth.length,
            totalGoals: goalsForCurrentMonth.length,
            completedGoals: completedGoalsForCurrentMonth.length,
        });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error retrieving monthly stats", res, status: 500 });
    }
});
exports.getMonthlyStats = getMonthlyStats;
