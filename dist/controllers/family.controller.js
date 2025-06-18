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
exports.getFamilyProgressStats = exports.getFamilyNameNbMembersStars = exports.updateAllFamilyMembersStars = exports.getFamilyLeaderboard = exports.getLeaderboard = exports.completeFamilyTask = exports.getFamilyTaskById = exports.deleteFamilyTask = exports.updateFamilyTask = exports.createFamilyTasks = exports.deleteFamilyGoal = exports.getFamilyGoals = exports.updateFamilyGoal = exports.deleteFamily = exports.updateFamily = exports.getFamilyMembers = exports.getFamily = exports.getAllFamilies = void 0;
const family_model_1 = require("../models/family.model");
const error_1 = require("../utils/error");
const user_model_1 = require("../models/user.model");
const checkId_1 = require("../utils/checkId");
const achievements_model_1 = require("../models/achievements.model");
const getTimePeriod_1 = require("../utils/getTimePeriod");
//API get all families
const getAllFamilies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const families = yield family_model_1.Family.find();
        if (!families || families.length === 0) {
            return (0, error_1.throwError)({ message: "Family not found.", res, status: 404 });
        }
        res.status(200).send({ message: "Retrieving all families successfully", families });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to retrieve all families.", res, status: 500 });
    }
});
exports.getAllFamilies = getAllFamilies;
// Get Family by ID
const getFamily = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId } = req.body;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        let projection = '_id familyName email familyAvatar totalStars tasks members';
        const family = yield family_model_1.Family.findById(familyId).select(projection).lean();
        ;
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found.", res, status: 404 });
        }
        res.status(200).send({ message: "Retrieving family successfully", family });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to retrieve family.", res, status: 500 });
    }
});
exports.getFamily = getFamily;
// Get family members of a family
const getFamilyMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId } = req.body;
        // Find family and populate members with full user details
        const family = yield family_model_1.Family.findById(familyId).populate({ path: "members._id", model: "User" }).lean();
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found.", res, status: 404 });
        }
        // Flatten the structure to avoid `_id` nesting
        const familyWithMembers = Object.assign(Object.assign({}, family), { members: family.members.map(member => (Object.assign(Object.assign({}, member._id), { role: member.role, gender: member.gender, avatar: member.avatar }))) });
        res.status(200).json({ message: "Retrieving family members successfully", familyWithMembers });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to retrieve family members.", res, status: 500 });
    }
});
exports.getFamilyMembers = getFamilyMembers;
// Update Family Details
const updateFamily = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { familyId, familyName, email, familyAvatar } = req.body;
        const targetFamilyId = familyId || req.user.familyId;
        if (!(0, checkId_1.checkId)({ id: targetFamilyId, res }))
            return;
        const family = yield family_model_1.Family.findById(targetFamilyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found.", res, status: 404 });
        }
        if (req.user.email !== family.email && req.user.role !== "admin") {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 401 });
        }
        // Check if a family with the same email or familyName exists
        if (email) {
            const existingFamilyWithEmail = yield family_model_1.Family.findOne({ email, _id: { $ne: family._id } });
            if (existingFamilyWithEmail) {
                return (0, error_1.throwError)({ message: "A family with the same email already exists.", res, status: 400 });
            }
        }
        if (familyName) {
            const existingFamilyWithName = yield family_model_1.Family.findOne({ familyName, _id: { $ne: family._id } });
            if (existingFamilyWithName) {
                return (0, error_1.throwError)({ message: "A family with the same name already exists.", res, status: 400 });
            }
        }
        family.familyName = familyName || family.familyName;
        family.email = email || family.email;
        family.familyAvatar = familyAvatar || family.familyAvatar;
        if (email) {
            yield user_model_1.User.updateMany({ familyId: targetFamilyId }, { $set: { email: email } });
        }
        yield family.save();
        res.status(200).send({ message: "Family updated successfully.", family: family });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to update family.", res, status: 500 });
    }
});
exports.updateFamily = updateFamily;
//API to delete family
const deleteFamily = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check for authorized user roles
        if (!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { familyId } = req.body;
        // Check if familyId is valid
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        // Find the family to delete
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found.", res, status: 404 });
        }
        if (req.user.email !== family.email && req.user.role !== "admin") {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 401 });
        }
        // Delete all users associated with the family
        yield user_model_1.User.deleteMany({ familyId });
        // Delete the family
        yield family_model_1.Family.findByIdAndDelete(familyId);
        res.status(200).send({ message: "Family and all associated members deleted successfully." });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to delete family.", res, status: 500 });
    }
});
exports.deleteFamily = deleteFamily;
//API to update goal of a family
const updateFamilyGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { familyId, goalId, title, description, type, dueDate, rewards } = req.body;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        if (req.user.role !== 'admin' && req.user.email !== family.email) {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 400 });
        }
        const goal = family.goals.find(goal => goal._id.toString() === goalId);
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
        yield family.save();
        res.status(200).json({ message: "Goal updated", goal });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error updating goal", res, status: 500 });
    }
});
exports.updateFamilyGoal = updateFamilyGoal;
//API to get all goals for a specific family
const getFamilyGoals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId } = req.body;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        res.status(200).json({ message: 'Family goals retrieved', goals: family.goals });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving family goals", res, status: 500 });
    }
});
exports.getFamilyGoals = getFamilyGoals;
//API to delete a specific goal from the family
const deleteFamilyGoal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, goalId } = req.body;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        const goalIndex = family.goals.findIndex(goal => goal._id.toString() === goalId);
        if (goalIndex === -1) {
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        }
        family.goals.splice(goalIndex, 1);
        yield family.save();
        res.status(200).json({ message: 'Goal deleted successfully', family });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error deleting family goal", res, status: 500 });
    }
});
exports.deleteFamilyGoal = deleteFamilyGoal;
// API to create task for family goals
const createFamilyTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, goalId, title, description, rewards } = req.body;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        if (!title || !description) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const newTask = {
            title,
            description,
            type: 'family',
            rewards: rewards || { stars: 2, coins: 1 },
            createdAt: new Date()
        };
        goal.tasks.push(newTask);
        yield family.save();
        res.status(201).json({ message: 'Task created successfully', Task: newTask });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while creating Task.", res, status: 500 });
    }
});
exports.createFamilyTasks = createFamilyTasks;
// API to update task
const updateFamilyTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, taskId, goalId, title, description, rewards } = req.body;
        if (!(0, checkId_1.checkId)({ id: taskId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return (0, error_1.throwError)({ message: "Task not found", res, status: 404 });
        }
        task.title = title || task.title;
        task.description = description || task.description;
        if (rewards) {
            task.rewards.stars = rewards.stars || task.rewards.stars;
            task.rewards.coins = rewards.coins || task.rewards.coins;
        }
        yield family.save();
        res.status(200).json({ message: "Task updated successfully", task });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while update task.", res, status: 500 });
    }
});
exports.updateFamilyTask = updateFamilyTask;
//API to delete task
const deleteFamilyTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { familyId, goalId, taskId } = req.body;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: taskId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal)
            return (0, error_1.throwError)({ message: "Goal not found", res, status: 404 });
        const taskIndex = goal.tasks.findIndex((task) => task._id.toString() === taskId);
        if (taskIndex === -1) {
            return (0, error_1.throwError)({ message: "Task not found", res, status: 404 });
        }
        const [deletedTask] = goal.tasks.splice(taskIndex, 1);
        yield family.save();
        res.status(200).json({ message: 'Task deleted successfully', DeletedTask: deletedTask });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error deleting task", res, status: 500 });
    }
});
exports.deleteFamilyTask = deleteFamilyTask;
//API to get family task by id
const getFamilyTaskById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, taskId, goalId } = req.body;
        if (!(0, checkId_1.checkId)({ id: taskId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: goalId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "family not found", res, status: 404 });
        }
        const goal = family.goals.find(goal => goal._id.toString() === goalId);
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
exports.getFamilyTaskById = getFamilyTaskById;
//API to complete family task
const completeFamilyTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, goalId, taskId } = req.body;
        if (!(0, checkId_1.checkId)({ id: familyId, res }) || !(0, checkId_1.checkId)({ id: goalId, res }) || !(0, checkId_1.checkId)({ id: taskId, res })) {
            return;
        }
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        const goal = family.goals.find(goal => goal._id.toString() === goalId);
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
        let totalStars = 0;
        for (const member of family.members) {
            const user = yield user_model_1.User.findById(member._id);
            if (user) {
                totalStars += task.rewards.stars;
                user.coins += task.rewards.coins;
                user.stars += task.rewards.stars;
                user.nbOfTasksCompleted += 1;
                yield user.save();
            }
        }
        goal.progress = (goal.tasks.filter(task => task.isCompleted).length / goal.tasks.length) * 100;
        // Check if all tasks in the goal are completed
        const allTasksCompleted = goal.tasks.every(task => task.isCompleted);
        if (allTasksCompleted) {
            goal.isCompleted = true;
            // Reward user with coins and stars
            for (const member of family.members) {
                const user = yield user_model_1.User.findById(member._id);
                if (user) {
                    totalStars += goal.rewards.stars;
                    user.coins += goal.rewards.coins;
                    user.stars += goal.rewards.stars;
                    yield user.save();
                }
            }
            // Unlock Achievement if available
            if (goal.rewards.achievementId) {
                const achievement = yield achievements_model_1.Achievement.findById(goal.rewards.achievementId);
                if (!achievement) {
                    return (0, error_1.throwError)({ message: "Achievement not found", res, status: 404 });
                }
                family.achievements.push({ achievementId: achievement._id, unlockedAt: new Date(), });
                res.status(200).json({ message: "Achievement unlocked successfully", achievement });
            }
        }
        family.totalStars += totalStars;
        family.stars.daily += totalStars;
        family.stars.weekly += totalStars;
        family.stars.monthly += totalStars;
        family.stars.yearly += totalStars;
        family.tasks += 1;
        family.taskCounts.daily += 1;
        family.taskCounts.weekly += 1;
        family.taskCounts.monthly += 1;
        family.taskCounts.yearly += 1;
        yield family.save();
        res.status(200).json({ message: "Task marked as done", task, goal });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error marking task as done", res, status: 500 });
    }
});
exports.completeFamilyTask = completeFamilyTask;
//API to get leaderboard
const getLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId } = req.query;
        const periods = {
            daily: { stars: 'stars.daily', tasks: 'taskCounts.daily' },
            weekly: { stars: 'stars.weekly', tasks: 'taskCounts.weekly' },
            monthly: { stars: 'stars.monthly', tasks: 'taskCounts.monthly' },
            yearly: { stars: 'stars.yearly', tasks: 'taskCounts.yearly' },
        };
        const results = {}; // Object to store top10 and familyRank for each period
        // Iterate through each period
        for (const [period, fields] of Object.entries(periods)) {
            const { stars, tasks } = fields;
            const families = yield family_model_1.Family.find()
                .select(`${stars} ${tasks} familyName familyAvatar`)
                .sort({ [stars]: -1, [tasks]: -1 })
                .exec();
            if (!families || families.length === 0) {
                results[`${period}Top10`] = [];
                results[`${period}FamilyRank`] = null;
                continue;
            }
            // Calculate leaderboard and ranks
            let rank = 0;
            let previousStars = 0;
            let previousTasks = 0;
            const leaderboard = families.map((family, index) => {
                const familyStars = family.get(stars) || 0;
                const familyTasks = family.get(tasks) || 0;
                // Update rank only when stars/tasks change
                if (familyStars !== previousStars || familyTasks !== previousTasks) {
                    rank++;
                    previousStars = familyStars;
                    previousTasks = familyTasks;
                }
                return {
                    familyName: family.familyName,
                    familyAvatar: family.familyAvatar,
                    stars: familyStars,
                    tasks: familyTasks,
                    rank,
                    familyId: family._id.toString(),
                };
            });
            if (!leaderboard) {
                res.status(200).send({ message: "no leaderboard" });
                return;
            }
            const top10 = leaderboard.filter(entry => entry.rank <= 10);
            results[`${period}Top10`] = top10;
            // Find the rank of the specific family for the period
            if (familyId) {
                results[`${period}FamilyRank`] = familyId
                    ? leaderboard.find((family) => family.familyId === familyId) || null
                    : null;
            }
        }
        res.status(200).json(Object.assign({ message: 'Leaderboard fetched successfully' }, results));
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard', error });
    }
});
exports.getLeaderboard = getLeaderboard;
const getFamilyLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId } = req.body;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        const members = yield user_model_1.User.find({ familyId }).select("stars nbOfTasksCompleted").sort({ totalStars: -1, tasks: -1 }).exec();
        if (!members) {
            return (0, error_1.throwError)({ message: "Members not found", res, status: 404 });
        }
        let rank = 1;
        let previousStars = 0;
        let previousTasks = 0;
        const leaderboard = members.map((member, index) => {
            if (previousStars !== member.stars || previousTasks !== member.nbOfTasksCompleted) {
                rank = index + 1;
            }
            previousStars = member.stars;
            previousTasks = member.nbOfTasksCompleted;
            return Object.assign(Object.assign({}, member.toObject()), { rank });
        });
        res.status(200).send({
            message: 'Leaderboard fetched successfully',
            familyLeaderboard: leaderboard,
        });
    }
    catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});
exports.getFamilyLeaderboard = getFamilyLeaderboard;
// API to update stars for all family members and recalculate total stars
const updateAllFamilyMembersStars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user || !req.user.familyId) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { stars } = req.body; // Stars to add to each member
        if (!Number.isInteger(stars)) {
            return (0, error_1.throwError)({ message: "Invalid stars value", res, status: 400 });
        }
        const family = yield family_model_1.Family.findById(req.user.familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        // Update stars for all family members
        const membersIds = family.members.map((member) => member._id);
        yield user_model_1.User.updateMany({ _id: { $in: membersIds } }, { $inc: { stars } });
        // Recalculate total stars for family
        const totalStars = yield user_model_1.User.aggregate([
            { $match: { _id: { $in: membersIds } } },
            { $group: { _id: null, totalStars: { $sum: "$stars" } } }
        ]);
        // Update the family document
        family.totalStars = ((_a = totalStars[0]) === null || _a === void 0 ? void 0 : _a.totalStars) || 0;
        yield family.save();
        res.status(200).json({
            message: "All family members' stars updated successfully",
            totalStars: family.totalStars,
        });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error updating family members' stars", res, status: 500 });
    }
});
exports.updateAllFamilyMembersStars = updateAllFamilyMembersStars;
//API to get family name and number of members
const getFamilyNameNbMembersStars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user || !req.user.familyId) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const family = yield family_model_1.Family.findById(req.user.familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        res.status(200).json({
            message: "Retrieving family name and number of members successfully",
            familyName: family.familyName,
            numberOfMembers: family.members.length,
            stars: family.totalStars,
        });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving family name and number of members", res, status: 500 });
    }
});
exports.getFamilyNameNbMembersStars = getFamilyNameNbMembersStars;
//API to get famly progress stats for goals, tasks, and achievements
const getFamilyProgressStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, timeFrame } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const targetFamilyId = familyId || req.user.familyId;
        if (!(0, checkId_1.checkId)({ id: targetFamilyId, res }))
            return;
        const family = yield family_model_1.Family.findById(targetFamilyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        // Get the date range for the selected time frame
        const { start, end } = (0, getTimePeriod_1.getTimePeriod)(timeFrame);
        const tasksForCurrentPeriod = family.goals.flatMap(goal => goal.tasks.filter(task => task.createdAt &&
            task.createdAt >= start &&
            task.createdAt <= end));
        const completedTasksForCurrentPeriod = tasksForCurrentPeriod.filter(task => task.isCompleted);
        const goalsForCurrentPeriod = family.goals.filter(goal => goal.createdAt >= start && goal.createdAt <= end);
        const completedGoalsForCurrentPeriod = goalsForCurrentPeriod.filter(goal => goal.isCompleted);
        const totalAchievements = yield achievements_model_1.Achievement.countDocuments();
        const unlockedAchievements = family.achievements.length;
        // Return stats
        res.status(200).json({
            totalTasks: tasksForCurrentPeriod.length,
            completedTasks: completedTasksForCurrentPeriod.length,
            totalGoals: goalsForCurrentPeriod.length,
            completedGoals: completedGoalsForCurrentPeriod.length,
            totalAchievements: totalAchievements,
            unlockedAchievements: unlockedAchievements
        });
    }
    catch (error) {
        console.error(error);
        return (0, error_1.throwError)({ message: "Error retrieving monthly stats", res, status: 500 });
    }
});
exports.getFamilyProgressStats = getFamilyProgressStats;
