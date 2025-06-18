"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Achievement = void 0;
const mongoose_1 = require("mongoose");
const achievementSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'], default: 'personal' },
    description: { type: String, required: true },
    starsReward: { type: Number, default: 0 },
    coinsReward: { type: Number, default: 0 },
    criteria: { type: String, required: true },
    photo: { type: String, required: true },
});
exports.Achievement = (0, mongoose_1.model)("Achievement", achievementSchema);
