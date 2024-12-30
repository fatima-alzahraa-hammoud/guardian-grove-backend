import multer from "multer";
import path from "path";

const coverImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/covers/");  // Store cover images in "uploads/covers/" folder
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter to allow only image files (e.g., .jpg, .jpeg, .png)
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"));
    }
};

// Initialize Multer for cover image
const uploadCoverImage = multer({
    storage: coverImageStorage,
    fileFilter: imageFilter,
});

export default uploadCoverImage;