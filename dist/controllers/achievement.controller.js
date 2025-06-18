"use strict";
// get Family achievements
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
exports.getLastFamilyUnlockedAchievement = exports.getLastUnlockedAchievement = exports.unlockFamilyAchievement = exports.unlockAchievement = exports.getUserAchievements = exports.getUnLockedAchievements = exports.getLockedAchievements = exports.getAchievements = exports.deleteAchievement = exports.updateAchievement = exports.createAchievement = void 0;
const achievements_model_1 = require("../models/achievements.model");
const error_1 = require("../utils/error");
const checkId_1 = require("../utils/checkId");
const user_model_1 = require("../models/user.model");
const family_model_1 = require("../models/family.model");
// API to create new achievement
const createAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const { title, description, starsReward, coinsReward, criteria, photo, type } = data;
        if (!title || !description || !criteria || !photo) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const newAchievement = new achievements_model_1.Achievement({
            title,
            description,
            starsReward: starsReward || 0,
            coinsReward: coinsReward || 0,
            criteria,
            photo,
            type: type || 'personal'
        });
        yield newAchievement.save();
        res.status(201).json({ message: "Achievement created successfully", Achievement: newAchievement });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred.", res, status: 500 });
    }
});
exports.createAchievement = createAchievement;
//API to update achievement
const updateAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { achievementId } = req.body;
        if (!(0, checkId_1.checkId)({ id: achievementId, res }))
            return;
        const updateData = Object.assign({}, req.body);
        delete updateData.achievementId; // Remove achievementId from the body for comparison
        if (Object.keys(updateData).length === 0) {
            return (0, error_1.throwError)({ message: "No other data provided to update", res, status: 400 });
        }
        const achievement = yield achievements_model_1.Achievement.findByIdAndUpdate(achievementId, req.body, { new: true, runValidators: true });
        if (!achievement) {
            return (0, error_1.throwError)({ message: "Achievement not found", res, status: 404 });
        }
        res.status(200).json({ message: "Achievement Updated Successfully", achievement });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
});
exports.updateAchievement = updateAchievement;
// API to delete adventure
const deleteAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { achievementId } = req.body;
        if (!(0, checkId_1.checkId)({ id: achievementId, res }))
            return;
        const achievement = yield achievements_model_1.Achievement.findByIdAndDelete(achievementId);
        if (!achievement)
            return (0, error_1.throwError)({ message: "Achievement not found", res, status: 404 });
        yield user_model_1.User.updateMany({ 'achievements.achievementId': achievementId }, { $pull: { achievements: { achievementId } } });
        yield family_model_1.Family.updateMany({ 'achievements.achievementId': achievementId }, { $pull: { achievements: { achievementId } } });
        res.status(200).json({ message: "Achievement deleted successfully", achievement });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
});
exports.deleteAchievement = deleteAchievement;
// API to get all achievements
const getAchievements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        let query = {};
        if (type && type !== "All") {
            query.type = type;
        }
        const achievements = yield achievements_model_1.Achievement.find(query);
        if (achievements.length === 0) {
            return (0, error_1.throwError)({ message: "No achievements found", res, status: 404 });
        }
        res.status(200).json({ message: "Getting all achievements Successfully", achievements });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while getting all achievements.", res, status: 500 });
    }
});
exports.getAchievements = getAchievements;
// API to get locked achievements
const getLockedAchievements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        const personalUnlockedAchievements = user.achievements.map((userAchievement) => userAchievement.achievementId.toString());
        const family = yield family_model_1.Family.findById(user.familyId);
        const familyUnlockedAchievements = family ? family.achievements.map((familyAchievement) => familyAchievement.achievementId.toString()) : [];
        const unlockedAchievements = [...personalUnlockedAchievements, ...familyUnlockedAchievements];
        const lockedAchievements = yield achievements_model_1.Achievement.find({
            _id: { $nin: unlockedAchievements },
        });
        res.status(200).json({ message: "Getting locked achievements Successfully", achievements: lockedAchievements });
    }
    catch (error) {
        (0, error_1.throwError)({ message: "An error occurred while fetching locked achievements.", res, status: 500 });
    }
});
exports.getLockedAchievements = getLockedAchievements;
// API to get unlocked achievements
const getUnLockedAchievements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        const personalUnlockedAchievements = user.achievements.map((userAchievement) => userAchievement.achievementId.toString());
        const family = yield family_model_1.Family.findById(user.familyId);
        const familyUnlockedAchievements = family ? family.achievements.map((familyAchievement) => familyAchievement.achievementId.toString()) : [];
        const unlockedAchievementIds = [
            ...personalUnlockedAchievements,
            ...familyUnlockedAchievements
        ];
        const unlockedAchievements = yield achievements_model_1.Achievement.find({
            _id: { $in: unlockedAchievementIds }
        });
        res.status(200).json({ message: "Getting locked achievements Successfully", achievements: unlockedAchievements });
    }
    catch (error) {
        (0, error_1.throwError)({ message: "An error occurred while fetching locked achievements.", res, status: 500 });
    }
});
exports.getUnLockedAchievements = getUnLockedAchievements;
//API to get user achievements
const getUserAchievements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        yield user.populate({
            path: 'achievements.achievementId',
            select: 'title description photo'
        });
        res.status(200).json({ message: "Getting user achievements Successfully", achievements: user.achievements });
    }
    catch (error) {
        (0, error_1.throwError)({ message: "An error occurred while fetching user achievements.", res, status: 500 });
    }
});
exports.getUserAchievements = getUserAchievements;
//API to unlock an achievement
const unlockAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { achievementId } = req.body;
        if (!(0, checkId_1.checkId)({ id: achievementId, res }))
            return;
        if (!req.user) {
            (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
            return;
        }
        const user = req.user;
        // Check if the achievementId exists in the Achievement collection
        const achievement = yield achievements_model_1.Achievement.findById(achievementId);
        if (!achievement) {
            return (0, error_1.throwError)({ message: "Achievement not found", res, status: 404 });
        }
        // Check if the achievement is already unlocked
        const existingAchievement = user.achievements.find((achievement) => achievement.achievementId.toString() === achievementId);
        if (existingAchievement) {
            return (0, error_1.throwError)({ message: "Achievement already unlocked", res, status: 400 });
        }
        if (achievement.type !== "personal") {
            return (0, error_1.throwError)({ message: "It is not personal achievement", res, status: 400 });
        }
        // Unlock the achievement
        const unlockedAchievement = {
            achievementId,
            unlockedAt: new Date(),
        };
        user.achievements.push(unlockedAchievement);
        yield user.save();
        res.status(200).json({ message: "Achievement unlocked successfully", unlockedAchievement });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An error occurred while unlocking the achievement.", res, status: 500 });
    }
});
exports.unlockAchievement = unlockAchievement;
//API to unlock family achievement
const unlockFamilyAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId, achievementId } = req.body;
        if (!(0, checkId_1.checkId)({ id: achievementId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId);
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        // Check if the achievementId exists in the Achievement collection
        const achievement = yield achievements_model_1.Achievement.findById(achievementId);
        if (!achievement) {
            return (0, error_1.throwError)({ message: "Achievement not found", res, status: 404 });
        }
        // Check if the achievement is already unlocked
        const existingAchievement = family.achievements.find((achievement) => achievement.achievementId.toString() === achievementId);
        if (existingAchievement) {
            return (0, error_1.throwError)({ message: "Achievement already unlocked", res, status: 400 });
        }
        if (achievement.type !== "family") {
            return (0, error_1.throwError)({ message: "It is not family achievement", res, status: 400 });
        }
        // Unlock the achievement
        const unlockedAchievement = {
            achievementId,
            unlockedAt: new Date(),
        };
        family.achievements.push(unlockedAchievement);
        yield family.save();
        res.status(200).json({ message: "Achievement unlocked successfully", unlockedAchievement });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An error occurred while unlocking the achievement.", res, status: 500 });
    }
});
exports.unlockFamilyAchievement = unlockFamilyAchievement;
//API to get last unlockedAchievement
const getLastUnlockedAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield user_model_1.User.findById(targetUserId).populate({
            path: "achievements.achievementId",
            select: "title photo description"
        });
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        if (user.achievements.length === 0) {
            res.status(200).send({ message: 'No achievements' });
            return;
        }
        const lastUnlocked = user.achievements[user.achievements.length - 1];
        const achievementDetails = {
            title: lastUnlocked.achievementId.title,
            photo: lastUnlocked.achievementId.photo,
            description: lastUnlocked.achievementId.description,
            unlockedAt: lastUnlocked.unlockedAt,
        };
        res.status(200).send({ message: 'Retrieve unlocked achievement successfully', lastUnlockedAchievement: achievementDetails });
    }
    catch (error) {
        console.error("Error fetching last unlocked achievement:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getLastUnlockedAchievement = getLastUnlockedAchievement;
//API to get last familyUnlockedAchievement
const getLastFamilyUnlockedAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { familyId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        if (!(0, checkId_1.checkId)({ id: familyId, res }))
            return;
        const family = yield family_model_1.Family.findById(familyId).populate({
            path: "achievements.achievementId",
            select: "title photo description"
        });
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found", res, status: 404 });
        }
        if (family.achievements.length === 0) {
            res.status(200).send({ message: 'No achievements' });
            return;
        }
        const lastUnlocked = family.achievements[family.achievements.length - 1];
        const achievementDetails = {
            title: lastUnlocked.achievementId.title,
            photo: lastUnlocked.achievementId.photo,
            description: lastUnlocked.achievementId.description,
            unlockedAt: lastUnlocked.unlockedAt,
        };
        res.status(200).send({ message: 'Retrieve last unlocked family achievement successfully', lastUnlockedAchievement: achievementDetails });
    }
    catch (error) {
        console.error("Error fetching last unlocked achievement:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.getLastFamilyUnlockedAchievement = getLastFamilyUnlockedAchievement;
