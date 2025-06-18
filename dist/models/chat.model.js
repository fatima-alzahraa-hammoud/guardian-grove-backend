"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    sender: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String },
    image: { type: String },
    timestamp: { type: Date, default: Date.now },
});
const chatSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
}, { timestamps: true });
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
