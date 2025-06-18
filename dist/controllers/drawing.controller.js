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
exports.updateDrawing = exports.deleteDrawing = exports.getDrawingById = exports.getDrawings = exports.createDrawing = void 0;
const cloudinary_1 = require("cloudinary");
const error_1 = require("../utils/error");
const path_1 = __importDefault(require("path"));
const checkId_1 = require("../utils/checkId");
const user_model_1 = require("../models/user.model");
const sanitizePublicId_1 = require("../utils/sanitizePublicId");
const extractPublicId_1 = require("../utils/extractPublicId");
//API to create and save drawing
const createDrawing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const drawingImage = (_a = files.imageUrl) === null || _a === void 0 ? void 0 : _a[0];
        if (!drawingImage) {
            return (0, error_1.throwError)({ message: 'Drawing image is required.', res, status: 400 });
        }
        // Sanitize the public_id for the drawing image
        const sanitizedDrawingImagePublicId = `drawings/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(drawingImage.originalname, path_1.default.extname(drawingImage.originalname)))}`;
        const result = yield new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'image',
                public_id: sanitizedDrawingImagePublicId
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(drawingImage.buffer);
        });
        const newDrawing = {
            title,
            drawing: result.secure_url,
            createdAt: new Date()
        };
        req.user.drawings.push(newDrawing);
        yield req.user.save();
        res.status(201).json({ message: 'Drawing created successfully', newDrawing });
    }
    catch (error) {
        console.error('Error creating drawing:', error);
        return (0, error_1.throwError)({ message: 'Error creating drawing', res, status: 500 });
    }
});
exports.createDrawing = createDrawing;
// API to get all drawings
const getDrawings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        res.status(200).json({ message: 'Drawings retrieved successfully', drawings: req.user.drawings });
    }
    catch (error) {
        console.error('Error retrieving drawings:', error);
        return (0, error_1.throwError)({ message: 'Error retrieving drawings', res, status: 500 });
    }
});
exports.getDrawings = getDrawings;
// API to get a drawing by ID
const getDrawingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { drawingId } = req.body;
        if (!(0, checkId_1.checkId)({ id: drawingId, res }))
            return;
        const drawing = req.user.drawings.find(drawing => drawing.id.toString() === drawingId);
        if (!drawing) {
            return (0, error_1.throwError)({ message: 'Drawing not found', res, status: 404 });
        }
        res.status(200).json({ message: 'Drawing retrieved successfully', drawing });
    }
    catch (error) {
        console.error('Error retrieving drawing:', error);
        return (0, error_1.throwError)({ message: 'Error retrieving drawing', res, status: 500 });
    }
});
exports.getDrawingById = getDrawingById;
// API to delete a drawing
const deleteDrawing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { drawingId } = req.body;
        if (!(0, checkId_1.checkId)({ id: drawingId, res }))
            return;
        const drawingIndex = req.user.drawings.findIndex((drawing) => drawing.id.toString() === drawingId);
        if (drawingIndex === -1) {
            return (0, error_1.throwError)({ message: "Drawing not found", res, status: 404 });
        }
        const drawing = req.user.drawings[drawingIndex];
        const drawingImagePublicId = `drawings/${(0, extractPublicId_1.extractPublicId)(drawing.drawing)}`;
        console.log(drawingImagePublicId);
        // Delete drawing image from Cloudinary
        yield cloudinary_1.v2.api.delete_resources([drawingImagePublicId], { resource_type: 'image' });
        const [deletedDrawing] = req.user.drawings.splice(drawingIndex, 1);
        yield req.user.save();
        res.status(200).json({ message: 'Drawing deleted successfully', deletedDrawing: deletedDrawing });
    }
    catch (error) {
        console.error('Error deleting drawing:', error);
        return (0, error_1.throwError)({ message: 'Error deleting drawing', res, status: 500 });
    }
});
exports.deleteDrawing = deleteDrawing;
//API to update drawings
const updateDrawing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { drawingId, userId } = req.params;
        if (!(0, checkId_1.checkId)({ id: drawingId, res }))
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
        const drawingImage = (_a = files === null || files === void 0 ? void 0 : files.imageUrl) === null || _a === void 0 ? void 0 : _a[0];
        const drawing = user.drawings.find(draw => draw.id.toString() === drawingId);
        if (!drawing) {
            return (0, error_1.throwError)({ message: 'Drawing not found', res, status: 404 });
        }
        if (title)
            drawing.title = title;
        if (drawingImage) {
            // Delete old drawing image from Cloudinary
            const drawingImagePublicId = `drawings/${(0, extractPublicId_1.extractPublicId)(drawing.drawing)}`;
            const image = yield cloudinary_1.v2.api.delete_resources([drawingImagePublicId]);
            // Upload new cover image to Cloudinary
            const sanitizedDrawingImagePublicId = `drawings/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(drawingImage.originalname, path_1.default.extname(drawingImage.originalname)))}`;
            const drawingImageResult = yield new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({
                    resource_type: 'image',
                    public_id: sanitizedDrawingImagePublicId
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                stream.end(drawingImage.buffer);
            });
            drawing.drawing = drawingImageResult.secure_url;
        }
        yield user.save();
        res.status(200).json({ message: 'Drawing updated successfully', updatedDrawing: drawing });
    }
    catch (error) {
        console.error('Error updating drawing:', error);
        return (0, error_1.throwError)({ message: 'Error updating drawing', res, status: 500 });
    }
});
exports.updateDrawing = updateDrawing;
