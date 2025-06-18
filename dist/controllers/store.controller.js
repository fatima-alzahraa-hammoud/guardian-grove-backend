"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyItem = exports.updateItem = exports.deleteItem = exports.createItem = exports.getStoreItems = void 0;
const storeItem_model_1 = require("../models/storeItem.model");
const error_1 = require("../utils/error");
const checkId_1 = require("../utils/checkId");
const user_model_1 = require("../models/user.model");
//API to get store items based on category
const getStoreItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.query;
        let query = {};
        if (category && category !== "All") {
            query = { type: category };
        }
        const items = yield storeItem_model_1.StoreItem.find(query);
        if (items.length === 0) {
            return (0, error_1.throwError)({ message: "No items found for this category", res, status: 400 });
        }
        res.status(200).json({ message: "get items successfully", items });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Error fetching store items", res, status: 400 });
    }
});
exports.getStoreItems = getStoreItems;
//API to add Items to store
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const { name, description, type, price, image } = data;
        if (!name || !type || !price || !image) {
            return (0, error_1.throwError)({ message: "All required fields must be filled.", res, status: 400 });
        }
        const newItem = new storeItem_model_1.StoreItem({
            name,
            description,
            price: price || 5,
            type,
            image,
        });
        yield newItem.save();
        res.status(201).json({ message: "StoreItem created successfully", StoreItem: newItem });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "An unknown error occurred.", res, status: 500 });
    }
});
exports.createItem = createItem;
// API to delete item
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { itemId } = req.params;
        if (!(0, checkId_1.checkId)({ id: itemId, res }))
            return;
        const item = yield storeItem_model_1.StoreItem.findByIdAndDelete(itemId);
        if (!item)
            return (0, error_1.throwError)({ message: "Item not found", res, status: 404 });
        yield user_model_1.User.updateMany({ 'purchasedItems.itemId': itemId }, { $pull: { purchasedItems: { itemId } } });
        console.log("hello");
        res.status(200).json({ message: "Item deleted successfully" });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
});
exports.deleteItem = deleteItem;
//API to update item
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { itemId } = req.body;
        if (!(0, checkId_1.checkId)({ id: itemId, res }))
            return;
        const updateData = Object.assign({}, req.body);
        delete updateData.itemId; // Remove itemId from the body for comparison
        if (Object.keys(updateData).length === 0) {
            return (0, error_1.throwError)({ message: "No other data provided to update", res, status: 400 });
        }
        const item = yield storeItem_model_1.StoreItem.findByIdAndUpdate(itemId, req.body, { new: true, runValidators: true });
        if (!item) {
            return (0, error_1.throwError)({ message: "Item not found", res, status: 404 });
        }
        res.status(200).json({ message: "Item Updated Successfully", item });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
});
exports.updateItem = updateItem;
//API to buy item
const buyItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const user = req.user;
        const { itemId } = req.body;
        const item = yield storeItem_model_1.StoreItem.findById(itemId);
        if (!item) {
            return (0, error_1.throwError)({ message: "Item not found", res, status: 404 });
        }
        // Check if user already owns the item
        const alreadyPurchased = user.purchasedItems.some((p) => p.itemId.toString() === itemId);
        if (alreadyPurchased) {
            return (0, error_1.throwError)({ message: "Item already purchased", res, status: 400 });
        }
        // Check if user has enough coins
        if (user.coins < item.price) {
            return (0, error_1.throwError)({ message: "Insufficient coins", res, status: 400 });
        }
        // Deduct coins and add item to purchases
        user.coins -= item.price;
        user.purchasedItems.push({
            itemId: item._id,
            purchasedAt: new Date()
        });
        yield user.save();
        res.status(200).json({ message: "Item purchased successfully", item });
    }
    catch (error) {
        return (0, error_1.throwError)({ message: "Purchase failed", res, status: 500 });
    }
});
exports.buyItem = buyItem;
