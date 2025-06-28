import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

/*const uploadDir = path.join(__dirname, '../uploads/books');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer to store files in the uploads/books directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});*/

const storage = multer.memoryStorage();

// File filter to accept only PDF, Word, and PPT files for bookFile
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.fieldname === 'bookFile') {
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            (req as any).fileValidationError = 'Only PDF, Word, and PPT files are allowed for bookFile';
            return cb(null, false);
        }
    }

    if (file.fieldname === 'coverImage') {
        const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            (req as any).fileValidationError = 'Only JPEG, PNG, and GIF files are allowed for coverImage';
            return cb(null, false);
        }
    }

    cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Multer middleware for handling multipart form data
export const bookUploadMiddleware = upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'bookFile', maxCount: 1 },
]);