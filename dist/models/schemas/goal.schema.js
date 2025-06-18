"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goalSchema = void 0;
const mongoose_1 = require("mongoose");
const task_schema_1 = require("./task.schema");
exports.goalSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'] },
    tasks: { type: [task_schema_1.taskSchema], default: [] },
    nbOfTasksCompleted: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
    dueDate: { type: Date },
    createdAt: { type: Date, required: true },
    completedAt: { type: Date },
    rewards: {
        stars: { type: Number, default: 10 },
        coins: { type: Number, default: 5 },
        achievementName: { type: String },
        achievementId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Achievement" },
    },
});
