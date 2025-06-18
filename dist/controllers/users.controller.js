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
exports.getUserAvatar = exports.getUserPurchasedItems = exports.getUserAdventures = exports.completeChallenge = exports.startAdventure = exports.getUserInterests = exports.getUserRank = exports.updateLocation = exports.getLocation = exports.updateUserCoins = exports.getUserCoins = exports.updateUserStars = exports.getUserStars = exports.updatePassword = exports.deleteUser = exports.editUserProfile = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("../models/user.model");
const error_1 = require("../utils/error");
const checkId_1 = require("../utils/checkId");
const adventure_model_1 = require("../models/adventure.model");
const family_model_1 = require("../models/family.model");
const recalculateFamilyMemberRanks_1 = require("../utils/recalculateFamilyMemberRanks");
const email_service_1 = require("../services/email.service");
const generateSecurePassword_1 = require("../utils/generateSecurePassword");
// API to get all users
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.User.find();
        res.status(200).send(users);
    }
    catch (error) {
        console.error("Error retrieving users:", error);
        return (0, error_1.throwError)({ message: "Error retrieving users", res, status: 500 });
    }
});
exports.getUsers = getUsers;
// API to get a user based on his Id
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const targetUserId = userId || req.user._id;
        if (!(0, checkId_1.checkId)({ id: targetUserId, res }))
            return;
        let projection = '_id name email birthday role avatar gender stars coins interests nbOfTasksCompleted rankInFamily memberSince familyId dailyMessage isTempPassword'; // Basic user info
        // Fetch the user with specific fields
        const user = yield user_model_1.User.findById(targetUserId).select(projection);
        // If user not found, return 404
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        if (req.user._id.toString() !== targetUserId.toString() && ['parent', 'child'].includes(req.user.role) && req.user.email != user.email) {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
        }
        res.status(200).json({ message: "Retrieving user successfully", user });
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        return (0, error_1.throwError)({ message: "Error retrieving user", res, status: 500 });
    }
});
exports.getUserById = getUserById;
// API to create user
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const { name, birthday, gender, role, avatar, interests } = data;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        if (req.user.role === "child") {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
        }
        // verify all fields are filled
        if (!name || !birthday || !gender || !role || !avatar || !interests) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const email = req.user.email;
        const existingUser = yield user_model_1.User.findOne({
            name: name,
            email: email
        });
        if (existingUser) {
            return (0, error_1.throwError)({ message: "This username is already taken for this email.", res, status: 409 });
        }
        if (!Array.isArray(interests)) {
            return (0, error_1.throwError)({ message: "Interests must be an array.", res, status: 400 });
        }
        // Gender Validation
        const validGenders = ['male', 'female'];
        if (!validGenders.includes(gender)) {
            return (0, error_1.throwError)({ message: "Gender must be either 'male' or 'female'.", res, status: 400 });
        }
        // Role validation
        const validRoles = ['owner', 'parent', 'child', 'admin'];
        if (!validRoles.includes(role)) {
            return (0, error_1.throwError)({ message: "Invalid role.", res, status: 400 });
        }
        // Birthday Validation
        if (isNaN(new Date(birthday).getTime())) {
            return (0, error_1.throwError)({ message: "Invalid birthday format.", res, status: 400 });
        }
        const generatedPassword = (0, generateSecurePassword_1.generateSecurePassword)();
        const hashedPassword = yield bcrypt_1.default.hash(generatedPassword, 12);
        // Find the parent's family
        const family = yield family_model_1.Family.findOne({ email: req.user.email });
        if (!family) {
            return (0, error_1.throwError)({ message: "Family not found.", res, status: 404 });
        }
        // Create the user with the parent's familyId
        const user = yield user_model_1.User.create(Object.assign(Object.assign({}, data), { email: email, password: hashedPassword, familyId: family._id // Link to parent's family
         }));
        // Add the new user to the family's members list
        if (!family.members.includes(user.id)) {
            family.members.push({ _id: user.id, role, name, gender, avatar });
            yield family.save();
        }
        // Recalculate the ranks after adding the new user
        yield (0, recalculateFamilyMemberRanks_1.recalculateFamilyMemberRanks)(family._id, user);
        const from = `"Guardian Grove" <${process.env.EMAIL_USERNAME}>`;
        const to = email;
        const subject = `Welcome to Guardian Grove - ${name}'s Account Details`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <h2 style="color: #2c3e50;">Welcome to Guardian Grove!</h2>
                    <p>Hello ${req.user.name},</p>
                    
                    <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3498db;">
                        <p>You've successfully created a <strong>${role}</strong> account for <strong>${name}</strong>.</p>
                        <p>Here are the login details:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd; width: 120px;"><strong>Username:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;"><strong>Temporary Password:</strong></td>
                                <td style="padding: 8px;">${generatedPassword}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="color: #e74c3c; font-weight: bold;">Please change this password after first login.</p>
                    
                    <p>If you didn't request this account creation, please contact our support immediately.</p>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p>Best regards,</p>
                        <p><strong>The Guardian Grove Team</strong></p>
                        <p style="font-size: 12px; color: #7f8c8d;">This is an automated message - please do not reply directly to this email.</p>
                    </div>
                </div>
            </div>
        `;
        // Send email with the temporary password
        yield (0, email_service_1.sendMail)(from, to, subject, html);
        yield user.save();
        console.log(user);
        res.status(200).send({ message: "User created successfully, password email sent.", user });
    }
    catch (error) {
        if (error instanceof Error) {
            // Handle MongoDB duplicate key error (11000)
            if (error.code === 11000) {
                return (0, error_1.throwError)({
                    message: "A user with this name and email already exists.",
                    res,
                    status: 409
                });
            }
            else {
                console.error("Error creating user:", error);
                return (0, error_1.throwError)({ message: error.message, res, status: 500 });
            }
        }
        else {
            console.error("Unknown error creating user:", error);
            return (0, error_1.throwError)({ message: "An unknown error occurred.", res, status: 500 });
        }
    }
});
exports.createUser = createUser;
// API to edit user profile
const editUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, name, birthday, gender, avatar, role } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        if ((role) && !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return (0, error_1.throwError)({ message: "Forbidden: You cannot change role nor email", res, status: 403 });
        }
        let user;
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            if (req.user._id.toString() !== userId && !['parent', 'admin', 'owner'].includes(req.user.role)) {
                return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
            }
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
            if (req.user.role !== "admin" && req.user.email !== user.email) {
                return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
            }
        }
        else {
            user = req.user;
        }
        // Check if a user with the same email and name exists
        if (name) {
            const existingUser = yield user_model_1.User.findOne({ email: user.email, name, _id: { $ne: user._id } });
            if (existingUser) {
                return (0, error_1.throwError)({ message: "A user with the same email and name already exists.", res, status: 400 });
            }
            user.name = name;
        }
        if (name)
            user.name = name;
        if (birthday)
            user.birthday = birthday;
        if (gender)
            user.gender = gender;
        if (avatar)
            user.avatar = avatar;
        if (role)
            user.role = role;
        yield user.save();
        res.status(200).send({ message: "User profile updated successfully", user });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
});
exports.editUserProfile = editUserProfile;
// API to delete user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        let user;
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            if (req.user._id.toString() !== userId && !['parent', 'admin', 'owner'].includes(req.user.role)) {
                return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
            }
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
            if (req.user.role !== "admin" && req.user.email !== user.email) {
                return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
            }
        }
        else {
            user = req.user;
        }
        // Prevent deleting the last parent in a family
        const family = yield family_model_1.Family.findById(user.familyId);
        if (family) {
            const parentsCount = yield user_model_1.User.countDocuments({ familyId: family._id, role: 'parent' });
            if (user.role === 'parent' && parentsCount <= 1) {
                return (0, error_1.throwError)({ message: "Cannot delete the last parent in the family", res, status: 400 });
            }
            // Remove user from the family members list
            family.members = family.members.filter((member) => member._id.toString() !== user._id.toString());
            yield family.save();
        }
        // Delete the user
        yield user_model_1.User.findByIdAndDelete(user._id);
        res.status(200).send({ message: "User deleted successfully", user });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
});
exports.deleteUser = deleteUser;
// API to update password
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, oldPassword, newPassword, confirmPassword } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        let user;
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            if (req.user._id.toString() !== userId && req.user.role !== "admin") {
                return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
            }
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
        }
        else {
            user = req.user;
        }
        // Validate required fields
        if (!oldPassword || !newPassword || !confirmPassword) {
            return (0, error_1.throwError)({ message: "All fields are required.", res, status: 400 });
        }
        if (newPassword !== confirmPassword) {
            return (0, error_1.throwError)({ message: "Passwords do not match.", res, status: 400 });
        }
        // Verify old password
        const isMatch = yield bcrypt_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            return (0, error_1.throwError)({ message: "Old password is incorrect.", res, status: 400 });
        }
        // Check if the new password is different from the old one
        const isSamePassword = yield bcrypt_1.default.compare(newPassword, req.user.password);
        if (isSamePassword) {
            return (0, error_1.throwError)({ message: "New password cannot be the same as the old password.", res, status: 400 });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return (0, error_1.throwError)({
                message: "Password must be at least 8 characters long, include an uppercase letter, lowercase letter, a number, and a special character.",
                res,
                status: 400
            });
        }
        // Hash new password
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        user.isTempPassword = false;
        yield user.save();
        // Return success response
        res.status(200).send({ message: "Password updated successfully.", password: newPassword });
    }
    catch (error) {
        console.error("Error updating password: ", error);
        return (0, error_1.throwError)({ message: "Failed to update password.", res, status: 500 });
    }
});
exports.updatePassword = updatePassword;
// API to get user's stars
const getUserStars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).send({ message: "Stars retrieved successfully", stars: req.user.stars });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving user stars", res, status: 500 });
    }
});
exports.getUserStars = getUserStars;
// API to update user's stars
const updateUserStars = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { stars } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        if (stars === undefined || typeof stars !== "number" || stars < 0) {
            return (0, error_1.throwError)({ message: "Stars must be a valid number.", res, status: 400 });
        }
        req.user.stars += stars;
        yield req.user.save();
        if (!req.user.familyId) {
            return (0, error_1.throwError)({ message: "No family id", res, status: 400 });
        }
        yield family_model_1.Family.findByIdAndUpdate(req.user.familyId, { $inc: { totalStars: stars } });
        yield (0, recalculateFamilyMemberRanks_1.recalculateFamilyMemberRanks)(req.user.familyId, req.user);
        res.status(200).send({ message: "User stars updated successfully", user: req.user });
    }
    catch (error) {
        console.error('Error updating user stars:', error);
        return (0, error_1.throwError)({ message: "Error updating user stars", res, status: 500 });
    }
});
exports.updateUserStars = updateUserStars;
// API to get user's coins
const getUserCoins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).send({ message: "Coins retrieved successfully", coins: req.user.coins });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving user coins", res, status: 500 });
    }
});
exports.getUserCoins = getUserCoins;
// API to update user's coins
const updateUserCoins = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { coins } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        if (coins === undefined || typeof coins !== "number") {
            return (0, error_1.throwError)({ message: "Stars must be a valid number.", res, status: 400 });
        }
        req.user.coins += coins;
        yield req.user.save();
        res.status(200).send({ message: "User coins updated successfully", user: req.user });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error updating user coins", res, status: 500 });
    }
});
exports.updateUserCoins = updateUserCoins;
// API to get user's location
const getLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).send({ message: "Location retrieved successfully", location: req.user.currentLocation });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving user location", res, status: 500 });
    }
});
exports.getLocation = getLocation;
// API to update user's current location
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currentLocation } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        if (typeof currentLocation !== "string" || currentLocation.trim() === "") {
            return (0, error_1.throwError)({ message: "Location must be valid.", res, status: 400 });
        }
        req.user.currentLocation = currentLocation;
        yield req.user.save();
        res.status(200).send({ message: "User location updated successfully", user: req.user });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error updating user location", res, status: 500 });
    }
});
exports.updateLocation = updateLocation;
// API to get user's rank
const getUserRank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).send({ message: "Rank retrieved successfully", Rank: req.user.rankInFamily });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving user rank", res, status: 500 });
    }
});
exports.getUserRank = getUserRank;
// API to update user's rank
/*export const updateUserRank = async(req:CustomRequest, res: Response): Promise<void> => {
    try{
        const { rank }: { rank: number } = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401});
        }

        if (rank === undefined || typeof rank !== "number"){
            return throwError({ message: "Rank must be a valid number.", res, status: 400});
        }

        req.user.rankInFamily = rank;
        await req.user.save();

        res.status(200).send({ message: "User rank updated successfully", user: req.user });
    }catch(error){
        return throwError({ message: "Error updating user rank", res, status: 500});
    }
};*/
// API to get user's interesets
const getUserInterests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).send({ message: "Interests retrieved successfully", Interests: req.user.interests });
    }
    catch (error) {
        (0, error_1.throwError)({ message: "Error retrieving user interests", res, status: 500 });
    }
});
exports.getUserInterests = getUserInterests;
// API to start an adventure
const startAdventure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const userId = req.user._id;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: userId.toString(), res }))
            return;
        // Find the adventure by adventureId
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure) {
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        }
        const existingAdventureProgress = req.user.adventures.find((adventureProgress) => adventureProgress.adventureId.equals(adventureId));
        if (existingAdventureProgress) {
            return (0, error_1.throwError)({ message: "Adventure already started", res, status: 400 });
        }
        // Add adventure to user's adventures
        const newAdventureProgress = {
            adventureId: adventureId,
            challenges: adventure.challenges.map((challenge) => ({
                challengeId: challenge._id,
                isCompleted: false,
            })),
            status: "in-progress",
            isAdventureCompleted: false,
            starsReward: adventure.starsReward,
            coinsReward: adventure.coinsReward,
            progress: 0,
        };
        req.user.adventures.push(newAdventureProgress);
        yield req.user.save();
        res.status(200).send({ message: "Adventure started successfully", user: req.user });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while starting the adventure.", res, status: 500 });
    }
});
exports.startAdventure = startAdventure;
const completeChallenge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId, challengeId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: challengeId, res }))
            return;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        const adventureProgress = user.adventures.find((adventure) => adventure.adventureId.equals(adventureId));
        if (!adventureProgress) {
            return (0, error_1.throwError)({ message: "Adventure not found in user's profile", res, status: 404 });
        }
        const challenge = adventureProgress.challenges.find((challenge) => challenge.challengeId.equals(challengeId));
        if (!challenge) {
            return (0, error_1.throwError)({ message: "Challenge not found in adventure", res, status: 404 });
        }
        // Fetch the full adventure to get challenge rewards
        const adventure = yield adventure_model_1.Adventure.findById(adventureId).lean();
        if (!adventure) {
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        }
        const targetChallenge = adventure.challenges.find(ch => ch._id.equals(challengeId));
        if (!targetChallenge) {
            return (0, error_1.throwError)({ message: "Challenge data not found in adventure", res, status: 404 });
        }
        // Mark challenge as complete and add rewards
        challenge.isCompleted = true;
        challenge.completedAt = new Date();
        const starsReward = targetChallenge.starsReward;
        const coinsReward = targetChallenge.coinsReward;
        user.stars += starsReward;
        user.coins += coinsReward;
        adventureProgress.progress = (adventureProgress.challenges.filter(challenge => challenge.isCompleted).length / adventureProgress.challenges.length) * 100;
        let adventureStars = 0;
        if (adventureProgress.progress === 100) {
            adventureProgress.isAdventureCompleted = true;
            adventureProgress.status = 'completed';
            adventureStars = adventureProgress.starsReward;
            user.coins += adventureProgress.coinsReward;
            user.stars += adventureStars;
        }
        // Update the family total stars
        if (user.familyId) {
            const totalStars = starsReward + adventureStars;
            yield family_model_1.Family.findByIdAndUpdate(user.familyId, {
                $inc: { totalStars: totalStars }
            });
            yield (0, recalculateFamilyMemberRanks_1.recalculateFamilyMemberRanks)(user.familyId, user);
        }
        yield user.save();
        res.status(200).json({ message: "Challenge completed successfully", adventureProgress });
    }
    catch (error) {
        console.error("Error completing challenge:", error);
        return (0, error_1.throwError)({ message: "An unknown error occurred while completing the challenge.", res, status: 500 });
    }
});
exports.completeChallenge = completeChallenge;
// API to get user's adventures
const getUserAdventures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).send({ message: "User adventures retrieved successfully", Adventure: req.user.adventures });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error retrieving user adventures", res, status: 500 });
    }
});
exports.getUserAdventures = getUserAdventures;
//API to get user's purchased items
const getUserPurchasedItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const targetUserId = userId || req.user._id;
        if (!(0, checkId_1.checkId)({ id: targetUserId, res }))
            return;
        const isAuthorized = req.user._id.toString() === targetUserId.toString();
        if (!isAuthorized) {
            return (0, error_1.throwError)({ message: "Forbidden", res, status: 403 });
        }
        // Fetch only itemIds from purchasedItems
        const user = yield user_model_1.User.findById(targetUserId).select('purchasedItems.itemId');
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const purchasedItemIds = user.purchasedItems.map((item) => item.itemId);
        res.status(200).json({ message: "Purchased items retrieved successfully", purchasedItems: purchasedItemIds });
    }
    catch (error) {
        console.error("Error retrieving purchased items:", error);
        return (0, error_1.throwError)({ message: "Error retrieving purchased items", res, status: 500 });
    }
});
exports.getUserPurchasedItems = getUserPurchasedItems;
//API to get user's avatar
const getUserAvatar = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        res.status(200).json({ message: "Avatar retrieved successfully", avatar: user.avatar });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error fetching avatar", res, status: 500 });
    }
});
exports.getUserAvatar = getUserAvatar;
