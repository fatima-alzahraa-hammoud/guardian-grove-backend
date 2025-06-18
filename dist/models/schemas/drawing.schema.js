"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.drawingSchema = void 0;
const mongoose_1 = require("mongoose");
exports.drawingSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    drawing: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
