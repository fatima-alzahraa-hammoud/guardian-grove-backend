import multer, { FileFilterCallback } from 'multer'; 
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.fieldname === 'drawing') {
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
export const drawingUploadMiddleware = upload.fields([
    { name: 'drawing', maxCount: 1 },
]);