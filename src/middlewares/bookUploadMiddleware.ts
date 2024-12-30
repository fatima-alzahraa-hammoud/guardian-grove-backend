import multer from 'multer';

// Multer setup for file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Multer middleware for handling multipart form data
export const bookUploadMiddleware = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'bookFile', maxCount: 1 },
]);
