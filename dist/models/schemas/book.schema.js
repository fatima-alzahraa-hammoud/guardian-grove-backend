"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookSchema = void 0;
const mongoose_1 = require("mongoose");
exports.bookSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    coverImage: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: String, required: true },
    bookFile: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
});
