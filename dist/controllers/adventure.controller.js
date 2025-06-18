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
exports.deleteAdventure = exports.updateAdventure = exports.getAdventureById = exports.getAllAdventures = exports.createAdventure = void 0;
const adventure_model_1 = require("../models/adventure.model");
const error_1 = require("../utils/error");
const checkId_1 = require("../utils/checkId");
// API to create new adventure
const createAdventure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const { title, description, starsReward, coinsReward } = data;
        if (!title || !description) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const newAdventure = new adventure_model_1.Adventure({
            title,
            description,
            starsReward: starsReward || 10,
            coinsReward: coinsReward || 5,
            challenges: [],
        });
        yield newAdventure.save();
        res.status(201).json({ message: "Adventure created successfully", adventure: newAdventure });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred.", res, status: 500 });
    }
});
exports.createAdventure = createAdventure;
// Get all adventures
const getAllAdventures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adventures = yield adventure_model_1.Adventure.find();
        if (!adventures) {
            return (0, error_1.throwError)({ message: "No adventures found", res, status: 400 });
        }
        res.status(200).json({ message: "Getting all adventures Successfully", adventures });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while getting all adventures.", res, status: 500 });
    }
});
exports.getAllAdventures = getAllAdventures;
// Get adventure by ID
const getAdventureById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        const adventure = yield adventure_model_1.Adventure.findById(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        res.status(200).json(adventure);
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred while getting the adventure.", res, status: 500 });
    }
});
exports.getAdventureById = getAdventureById;
const updateAdventure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        const updateData = Object.assign({}, req.body);
        delete updateData.adventureId; // Remove adventureId from the body for comparison
        if (Object.keys(updateData).length === 0) {
            return (0, error_1.throwError)({ message: "No other data provided to update", res, status: 400 });
        }
        const adventure = yield adventure_model_1.Adventure.findByIdAndUpdate(adventureId, req.body, { new: true, runValidators: true });
        if (!adventure) {
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        }
        res.status(200).json({ message: "Adventure Updated Successfully", adventure });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
});
exports.updateAdventure = updateAdventure;
const deleteAdventure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { adventureId } = req.body;
        if (!(0, checkId_1.checkId)({ id: adventureId, res }))
            return;
        const adventure = yield adventure_model_1.Adventure.findByIdAndDelete(adventureId);
        if (!adventure)
            return (0, error_1.throwError)({ message: "Adventure not found", res, status: 404 });
        res.status(200).json({ message: "Adventure deleted successfully", adventure });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
});
exports.deleteAdventure = deleteAdventure;
