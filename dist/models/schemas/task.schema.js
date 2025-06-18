"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskSchema = void 0;
const mongoose_1 = require("mongoose");
exports.taskSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'] },
    isCompleted: { type: Boolean, default: false },
    createdAt: { type: Date },
    completedAt: { type: Date },
    rewards: {
        stars: { type: Number, default: 2 },
        coins: { type: Number, default: 1 }
    },
});
