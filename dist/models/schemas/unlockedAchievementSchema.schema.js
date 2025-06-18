"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unlockedAchievementSchema = void 0;
const mongoose_1 = require("mongoose");
exports.unlockedAchievementSchema = new mongoose_1.Schema({
    achievementId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Achievement", required: true },
    unlockedAt: { type: Date, default: Date.now },
}, { _id: false });
