"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationSchema = void 0;
const mongoose_1 = require("mongoose");
exports.notificationSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true, enum: ['personal', 'family'], default: 'personal' },
    timestamp: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false },
    isReadBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }]
});
