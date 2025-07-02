import multer, { FileFilterCallback } from 'multer'; 
import { Request } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if ((file.fieldname === 'imageUrl' || file.fieldname === 'avatar' || file.fieldname === 'familyAvatar') && !allowedMimeTypes.includes(file.mimetype)) {
        (req as any).fileValidationError = 'Only JPEG, PNG, and GIF files are allowed for images';
        return cb(null, false);
    }
    
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Multer middleware for handling multipart form data
export const imageUploadMiddleware = upload.fields([
    { name: 'imageUrl', maxCount: 1 },
    { name: 'avatar', maxCount: 1 },
    { name: 'familyAvatar', maxCount: 1 },
]);