import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Use memory storage for Cloudinary uploads (consistent with your existing pattern)
const journalStorage = multer.memoryStorage();

// Filter to allow only specific file types for journal entries
const journalFileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = {
        'image/jpeg': true,
        'image/jpg': true, 
        'image/png': true,
        'image/gif': true,
        'video/mp4': true,
        'video/quicktime': true,
        'video/avi': true,
        'video/mov': true,
        'audio/mpeg': true,
        'audio/wav': true,
        'audio/mp3': true,
        'audio/m4a': true,
        'audio/aac': true
    };
    
    if (file.fieldname === 'thumbnail' && !allowedTypes[file.mimetype as keyof typeof allowedTypes]) {
        (req as any).fileValidationError = 'Only image (JPEG, PNG, GIF), video (MP4, MOV, AVI, QuickTime), and audio (MP3, WAV, MPEG, M4A, AAC) files are allowed for journal entries';
        return cb(null, false);
    }
    
    cb(null, true);
};

// Initialize Multer for journal files
const uploadJournalFile = multer({
    storage: journalStorage,
    fileFilter: journalFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

// Export the middleware for single file upload
export const journalUploadMiddleware = uploadJournalFile.single('media');

export default uploadJournalFile;