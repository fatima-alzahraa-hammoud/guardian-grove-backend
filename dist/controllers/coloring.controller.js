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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateColoring = exports.deleteColoring = exports.getColoringById = exports.getColorings = exports.createColoring = void 0;
const cloudinary_1 = require("cloudinary");
const error_1 = require("../utils/error");
const path_1 = __importDefault(require("path"));
const sanitizePublicId_1 = require("../utils/sanitizePublicId");
const checkId_1 = require("../utils/checkId");
const extractPublicId_1 = require("../utils/extractPublicId");
const user_model_1 = require("../models/user.model");
//API to create and save coloring
const createColoring = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        const { title } = req.body;
        if (!title) {
            return (0, error_1.throwError)({ message: "Title is required", res, status: 400 });
        }
        const files = req.files;
        const coloringImage = (_a = files.imageUrl) === null || _a === void 0 ? void 0 : _a[0];
        if (!coloringImage) {
            return (0, error_1.throwError)({ message: 'Coloring image is required.', res, status: 400 });
        }
        // Sanitize the public_id for the drawing image
        const sanitizedColoringImagePublicId = `colorings/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(coloringImage.originalname, path_1.default.extname(coloringImage.originalname)))}`;
        const result = yield new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'image',
                public_id: sanitizedColoringImagePublicId
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(coloringImage.buffer);
        });
        const newColoringImage = {
            title,
            imageUrl: result.secure_url,
            createdAt: new Date()
        };
        req.user.colorings.push(newColoringImage);
        yield req.user.save();
        res.status(201).json({ message: 'Coloring Image created successfully', newColoringImage });
    }
    catch (error) {
        console.error('Error creating coloring image:', error);
        return (0, error_1.throwError)({ message: 'Error creating coloring image', res, status: 500 });
    }
});
exports.createColoring = createColoring;
//API to get coloring images
const getColorings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: "Unauthorized", res, status: 401 });
        }
        res.status(200).json({ message: 'Colorings retrieved successfully', colorings: req.user.colorings });
    }
    catch (error) {
        console.error('Error getting colorings:', error);
        return (0, error_1.throwError)({ message: 'Error getting colorings', res, status: 500 });
    }
});
exports.getColorings = getColorings;
// API to get a coloring by ID
const getColoringById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { coloringId } = req.body;
        if (!(0, checkId_1.checkId)({ id: coloringId, res }))
            return;
        const coloring = req.user.colorings.find(coloring => coloring.id.toString() === coloringId);
        if (!coloring) {
            return (0, error_1.throwError)({ message: 'Coloring not found', res, status: 404 });
        }
        res.status(200).json({ message: 'Coloring retrieved successfully', coloring });
    }
    catch (error) {
        console.error('Error retrieving coloring:', error);
        return (0, error_1.throwError)({ message: 'Error retrieving coloring', res, status: 500 });
    }
});
exports.getColoringById = getColoringById;
// API to delete a coloring
const deleteColoring = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { coloringId } = req.body;
        if (!(0, checkId_1.checkId)({ id: coloringId, res }))
            return;
        const coloringIndex = req.user.colorings.findIndex((coloring) => coloring.id.toString() === coloringId);
        if (coloringIndex === -1) {
            return (0, error_1.throwError)({ message: "Coloring not found", res, status: 404 });
        }
        const coloring = req.user.colorings[coloringIndex];
        const coloringImagePublicId = `colorings/${(0, extractPublicId_1.extractPublicId)(coloring.imageUrl)}`;
        // Delete drawing image from Cloudinary
        yield cloudinary_1.v2.api.delete_resources([coloringImagePublicId], { resource_type: 'image' });
        const [deletedDColoring] = req.user.colorings.splice(coloringIndex, 1);
        yield req.user.save();
        res.status(200).json({ message: 'Coloring deleted successfully', deletedColoring: deletedDColoring });
    }
    catch (error) {
        console.error('Error deleting coloring:', error);
        return (0, error_1.throwError)({ message: 'Error deleting coloring', res, status: 500 });
    }
});
exports.deleteColoring = deleteColoring;
//API to update colorings
const updateColoring = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { coloringId, userId } = req.params;
        if (!(0, checkId_1.checkId)({ id: coloringId, res }))
            return;
        let user;
        if (userId && userId !== req.user._id.toString() && req.user.role !== "admin") {
            return (0, error_1.throwError)({ message: 'Forbidden', res, status: 401 });
        }
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
        }
        else {
            user = req.user;
        }
        const { title } = req.body;
        const files = req.files;
        const coloringImage = (_a = files === null || files === void 0 ? void 0 : files.imageUrl) === null || _a === void 0 ? void 0 : _a[0];
        const coloring = user.colorings.find(color => color.id.toString() === coloringId);
        if (!coloring) {
            return (0, error_1.throwError)({ message: 'Coloring not found', res, status: 404 });
        }
        if (title)
            coloring.title = title;
        if (coloringImage) {
            // Delete old drawing image from Cloudinary
            const coloringImagePublicId = `colorings/${(0, extractPublicId_1.extractPublicId)(coloring.imageUrl)}`;
            const image = yield cloudinary_1.v2.api.delete_resources([coloringImagePublicId]);
            // Upload new cover image to Cloudinary
            const sanitizedColoringImagePublicId = `colorings/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(coloringImage.originalname, path_1.default.extname(coloringImage.originalname)))}`;
            const coloringImageResult = yield new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({
                    resource_type: 'image',
                    public_id: sanitizedColoringImagePublicId
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                stream.end(coloringImage.buffer);
            });
            coloring.imageUrl = coloringImageResult.secure_url;
        }
        yield user.save();
        res.status(200).json({ message: 'Coloring updated successfully', updatedColoring: coloring });
    }
    catch (error) {
        console.error('Error updating coloring', error);
        return (0, error_1.throwError)({ message: 'Error updating coloring', res, status: 500 });
    }
});
exports.updateColoring = updateColoring;
