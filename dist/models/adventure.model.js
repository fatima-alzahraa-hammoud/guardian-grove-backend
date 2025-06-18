"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adventure = void 0;
const mongoose_1 = require("mongoose");
const challengeSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    starsReward: { type: Number, required: true, default: 2 },
    coinsReward: { type: Number, required: true, default: 1 },
});
const adventureSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    starsReward: { type: Number, required: true, default: 10 },
    coinsReward: { type: Number, required: true, default: 5 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    challenges: { type: [challengeSchema], required: true, default: [] },
});
exports.Adventure = (0, mongoose_1.model)("Adventure", adventureSchema);
