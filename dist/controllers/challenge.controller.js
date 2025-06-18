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
exports.deleteChallenge = exports.updateChallege = exports.getChallengeById = exports.getAllChallenges = exports.createChallenge = void 0;
const adventure_model_1 = require("../models/adventure.model");
const error_1 = require("../utils/error");
const checkId_1 = require("../utils/checkId");
// API to create challenges
const createChallenge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId, title, content, starsReward, coinsReward } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        if (!title || !content) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const challenge = {
            title,
            content,
            starsReward: starsReward || 2,
            coinsReward: coinsReward || 1,
        };
        adventure.challenges.push(challenge);
        yield adventure.save();
        res.status(201).json({ message: 'Challenge created successfully', Challenge: challenge });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while creating.", res, status: 500 });
    }
});
exports.createChallenge = createChallenge;
// API to get all challenges
const getAllChallenges = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        res.status(200).json({ message: 'Retrieving challenges successfully', Challenges: adventure.challenges });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while getting all challenges.", res, status: 500 });
    }
});
exports.getAllChallenges = getAllChallenges;
// API to get challenges by id
const getChallengeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId, challengeId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: challengeId, res }))
            return;
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        const challenge = adventure.challenges.find(chal => chal._id.toString() === challengeId);
        if (!challenge) {
            return (0, error_1.throwError)({ message: "Challenge not found", res, status: 404 });
        }
        res.status(200).json({ message: 'Retrieving challenge successfully', Challenges: challenge });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while getting challenge.", res, status: 500 });
    }
});
exports.getChallengeById = getChallengeById;
// API to update challenges
const updateChallege = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId, challengeId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: challengeId, res }))
            return;
        const updateData = Object.assign({}, req.body);
        delete updateData.adventureId;
        delete updateData.challengeId;
        if (Object.keys(updateData).length === 0) {
            return (0, error_1.throwError)({ message: "No other data provided to update", res, status: 400 });
        }
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        const challenge = adventure.challenges.find(chal => chal._id.toString() === challengeId);
        if (!challenge) {
            return (0, error_1.throwError)({ message: "Challenge not found", res, status: 404 });
        }
        Object.assign(challenge, updateData);
        yield adventure.save();
        res.status(200).json({ message: 'Updating challenge successfully', Challenges: challenge });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while updating challenge.", res, status: 500 });
    }
});
exports.updateChallege = updateChallege;
// API to delete challenge
const deleteChallenge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId, challengeId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        if (!(0, checkId_1.checkId)({ id: challengeId, res }))
            return;
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        const challengeIndex = adventure.challenges.findIndex(chal => chal._id.toString() === challengeId);
        if (challengeIndex === -1)
            return (0, error_1.throwError)({ message: "Challenge not found", res, status: 404 });
        // Remove the challenge from the array
        adventure.challenges.splice(challengeIndex, 1);
        yield adventure.save();
        res.status(200).json({ message: "Challenge deleted successfully", adventure });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
});
exports.deleteChallenge = deleteChallenge;
