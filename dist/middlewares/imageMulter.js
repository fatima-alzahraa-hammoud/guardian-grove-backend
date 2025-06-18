"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const coverImageStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/covers/"); // Store cover images in "uploads/covers/" folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
// Filter to allow only image files (e.g., .jpg, .jpeg, .png)
const imageFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed!"));
    }
};
// Initialize Multer for cover image
const uploadCoverImage = (0, multer_1.default)({
    storage: coverImageStorage,
    fileFilter: imageFilter,
});
exports.default = uploadCoverImage;
