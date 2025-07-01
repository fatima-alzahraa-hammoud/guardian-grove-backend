import multer from "multer";
import path from "path";

const journalStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/journal/");  // Store journal files in "uploads/journal/" folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter to allow only specific file types
const journalFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        "image/jpeg", "image/jpg", "image/png", // Images
        "video/mp4", "video/quicktime",         // Videos
        "audio/mpeg", "audio/wav", "audio/mp3" // Audio
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image, video, and audio files are allowed!"));
    }
};

// Initialize Multer for journal files
const uploadJournalFile = multer({
    storage: journalStorage,
    fileFilter: journalFileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

export default uploadJournalFile;