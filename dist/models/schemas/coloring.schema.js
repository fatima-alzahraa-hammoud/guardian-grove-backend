"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coloringSchema = void 0;
const mongoose_1 = require("mongoose");
exports.coloringSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
