import multer from "multer";
import path from "path";

// Configure storage for PDFs and Word files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/books");  // Store files in "uploads" folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// PDF and Word filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF and Word files are allowed!"));
    }
};

// Initialize Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

export default upload;