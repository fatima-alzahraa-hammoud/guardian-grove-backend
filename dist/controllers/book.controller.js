"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBook = exports.updateBook = exports.deleteBook = exports.getUserBooks = exports.uploadBook = void 0;
const error_1 = require("../utils/error");
const cloudinary_1 = require("cloudinary");
const mongoose_1 = require("mongoose");
const path_1 = __importDefault(require("path"));
const user_model_1 = require("../models/user.model");
const checkId_1 = require("../utils/checkId");
const sanitizePublicId_1 = require("../utils/sanitizePublicId");
const extractPublicId_1 = require("../utils/extractPublicId");
/*const sanitizePublicId = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9-_]/g, '_');
};

export const uploadBook = async (req: CustomRequest, res:Response): Promise<void> =>{
    try{

        if(!req.files){
            return throwError({message: "files required", res, status: 400});
        }

        if ((req as any).fileValidationError) {
            return throwError({message: (req as any).fileValidationError, res, status: 400});
        }

        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { title, author, description } = req.body;

        if (!title || !author || !description){
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        let coverImage: string;
        let bookFile: string;

        if (Array.isArray(req.files)) {
            coverImage = req.files[0].path;
            bookFile = req.files[1].path;
        } else {
            coverImage = req.files.coverImage[0].path;
            bookFile = req.files.bookFile[0].path;
        }
 
        const coverImageResult = await cloudinary.uploader.upload(coverImage);

        const sanitizedPublicId = `books/${sanitizePublicId(path.basename(bookFile, path.extname(bookFile)))}`;

        const bookFileResult = await cloudinary.uploader.upload(bookFile, {
            resource_type: 'raw',
            public_id: sanitizedPublicId,
            type: 'upload',
            access_mode: 'public'
        });

        const newBook: IBook = {
            _id: new Types.ObjectId(),
            title,
            author,
            description,
            coverImage: coverImageResult.secure_url,
            bookFile: bookFileResult.secure_url,
            uploadedAt: new Date(),
        } as IBook;

        req.user.books.push(newBook);
        await req.user.save();
        res.status(201).json({ message: 'Book uploaded successfully', book: newBook });

    }catch(error){
        console.error('Error uploading book:', error);
        return throwError({ message: 'Error uploading book', res, status: 500 });
    }
}*/
// API to upload book
const uploadBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        if (req.fileValidationError) {
            return (0, error_1.throwError)({ message: req.fileValidationError, res, status: 400 });
        }
        const { title, author, description } = req.body;
        if (!title || !author || !description) {
            return (0, error_1.throwError)({ message: 'All required fields must be filled.', res, status: 400 });
        }
        const files = req.files;
        const coverImage = (_a = files.coverImage) === null || _a === void 0 ? void 0 : _a[0];
        const bookFile = (_b = files.bookFile) === null || _b === void 0 ? void 0 : _b[0];
        if (!coverImage || !bookFile) {
            return (0, error_1.throwError)({ message: 'Cover image and book file are required.', res, status: 400 });
        }
        // Sanitize the public_id for the cover image
        const sanitizedCoverImagePublicId = `covers/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(coverImage.originalname, path_1.default.extname(coverImage.originalname)))}`;
        // Upload cover image to Cloudinary
        const coverImageResult = yield new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'image',
                public_id: sanitizedCoverImagePublicId
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(coverImage.buffer);
        });
        // Sanitize the public_id for the book file
        const sanitizedPublicId = `books/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(bookFile.originalname, path_1.default.extname(bookFile.originalname)))}${path_1.default.extname(bookFile.originalname)}`;
        // Upload book file to Cloudinary with a specific name
        const bookFileResult = yield new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'raw',
                public_id: sanitizedPublicId
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
            stream.end(bookFile.buffer);
        });
        const newBook = {
            _id: new mongoose_1.Types.ObjectId(),
            title,
            author,
            description,
            coverImage: coverImageResult.secure_url,
            bookFile: bookFileResult.secure_url,
            uploadedAt: new Date(),
        };
        req.user.books.push(newBook);
        yield req.user.save();
        res.status(201).json({ message: 'Book uploaded successfully', book: newBook });
    }
    catch (error) {
        console.error('Error uploading book:', error);
        return (0, error_1.throwError)({ message: 'Error uploading book', res, status: 500 });
    }
});
exports.uploadBook = uploadBook;
// API to get user books
const getUserBooks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const books = req.user.books;
        res.status(200).json({ message: 'Books retrieved successfully', books });
    }
    catch (error) {
        console.error('Error retrieving books:', error);
        return (0, error_1.throwError)({ message: 'Error retrieving books', res, status: 500 });
    }
});
exports.getUserBooks = getUserBooks;
//API to delete book
const deleteBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { bookId, userId } = req.body;
        if (!(0, checkId_1.checkId)({ id: bookId, res }))
            return;
        let user;
        if (userId && userId !== req.user._id && req.user.role !== "admin") {
            return (0, error_1.throwError)({ message: 'Forbidden', res, status: 401 });
        }
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
        }
        else {
            user = req.user;
        }
        const bookIndex = user.books.findIndex(book => book.id.toString() === bookId);
        if (bookIndex === -1) {
            return (0, error_1.throwError)({ message: 'Book not found', res, status: 404 });
        }
        const book = user.books[bookIndex];
        // Extract public_id from URLs
        const coverImagePublicId = `covers/${(0, extractPublicId_1.extractPublicId)(book.coverImage)}`;
        const bookFilePublicId = `books/${(0, extractPublicId_1.extractPublicId)(book.bookFile)}`;
        // Delete cover image from Cloudinary
        yield cloudinary_1.v2.uploader.destroy(coverImagePublicId, { resource_type: 'image' });
        // Delete book file from Cloudinary
        yield cloudinary_1.v2.uploader.destroy(bookFilePublicId, { resource_type: 'raw' });
        // Remove book from user's collection
        user.books.splice(bookIndex, 1);
        yield user.save();
        res.status(200).json({ message: 'Book deleted successfully', DeletedBook: book });
    }
    catch (error) {
        console.error('Error deleting book:', error);
        return (0, error_1.throwError)({ message: 'Error deleting book', res, status: 500 });
    }
});
exports.deleteBook = deleteBook;
//API to update book
const updateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const { bookId, userId } = req.params;
        if (!(0, checkId_1.checkId)({ id: bookId, res }))
            return;
        let user;
        if (userId && userId !== req.user._id.toString() && req.user.role !== "admin") {
            return (0, error_1.throwError)({ message: 'Forbidden', res, status: 401 });
        }
        if (userId) {
            if (!(0, checkId_1.checkId)({ id: userId, res }))
                return;
            user = yield user_model_1.User.findById(userId);
            if (!user) {
                return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
            }
        }
        else {
            user = req.user;
        }
        const { title, author, description } = req.body;
        const files = req.files;
        const coverImage = (_a = files === null || files === void 0 ? void 0 : files.coverImage) === null || _a === void 0 ? void 0 : _a[0];
        const bookFile = (_b = files === null || files === void 0 ? void 0 : files.bookFile) === null || _b === void 0 ? void 0 : _b[0];
        const book = user.books.find(book => book.id.toString() === bookId);
        if (!book) {
            return (0, error_1.throwError)({ message: 'Book not found', res, status: 404 });
        }
        if (title)
            book.title = title;
        if (author)
            book.author = author;
        if (description)
            book.description = description;
        if (coverImage) {
            // Delete old cover image from Cloudinary
            const coverImagePublicId = `covers/${(0, extractPublicId_1.extractPublicId)(book.coverImage)}`;
            const image = yield cloudinary_1.v2.api.delete_resources([coverImagePublicId]);
            // Upload new cover image to Cloudinary
            const sanitizedCoverImagePublicId = `covers/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(coverImage.originalname, path_1.default.extname(coverImage.originalname)))}`;
            const coverImageResult = yield new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({
                    resource_type: 'image',
                    public_id: sanitizedCoverImagePublicId
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                stream.end(coverImage.buffer);
            });
            book.coverImage = coverImageResult.secure_url;
        }
        if (bookFile) {
            // Delete old book file from Cloudinary
            const bookFilePublicId = `books/${(0, extractPublicId_1.extractPublicId)(book.bookFile)}`;
            yield cloudinary_1.v2.uploader.destroy(bookFilePublicId);
            // Upload new book file to Cloudinary
            const sanitizedPublicId = `books/${Date.now()}-${(0, sanitizePublicId_1.sanitizePublicId)(path_1.default.basename(bookFile.originalname, path_1.default.extname(bookFile.originalname)))}${path_1.default.extname(bookFile.originalname)}`;
            const bookFileResult = yield new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({
                    resource_type: 'raw',
                    public_id: sanitizedPublicId
                }, (error, result) => {
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                });
                stream.end(bookFile.buffer);
            });
            book.bookFile = bookFileResult.secure_url;
        }
        yield user.save();
        res.status(200).json({ message: 'Book updated successfully', updatedBook: book });
    }
    catch (error) {
        console.error('Error updating book:', error);
        return (0, error_1.throwError)({ message: 'Error updating book', res, status: 500 });
    }
});
exports.updateBook = updateBook;
// API to download book
const downloadBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookId } = req.body;
        if (!req.user) {
            return (0, error_1.throwError)({ message: 'Unauthorized', res, status: 401 });
        }
        const book = req.user.books.find(book => book.id.toString() === bookId);
        if (!book) {
            return (0, error_1.throwError)({ message: 'Book not found', res, status: 404 });
        }
        res.redirect(book.bookFile);
    }
    catch (error) {
        console.error('Error downloading book:', error);
        return (0, error_1.throwError)({ message: 'Error downloading book', res, status: 500 });
    }
});
exports.downloadBook = downloadBook;
