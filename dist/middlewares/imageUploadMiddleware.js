"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (file.fieldname === 'imagUrl' && !allowedMimeTypes.includes(file.mimetype)) {
        req.fileValidationError = 'Only JPEG, PNG, and GIF files are allowed for drawings';
        return cb(null, false);
    }
    cb(null, true);
};
const upload = (0, multer_1.default)({ storage, fileFilter });
// Multer middleware for handling multipart form data
exports.imageUploadMiddleware = upload.fields([
    { name: 'imageUrl', maxCount: 1 },
]);
