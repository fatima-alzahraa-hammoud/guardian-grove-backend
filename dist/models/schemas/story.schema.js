"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storySchema = void 0;
const mongoose_1 = require("mongoose");
exports.storySchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['personal', 'family'], default: 'personal' },
    collaborators: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});
