"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreItem = void 0;
const mongoose_1 = require("mongoose");
const storeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
});
exports.StoreItem = (0, mongoose_1.model)("StoreItem", storeSchema);
