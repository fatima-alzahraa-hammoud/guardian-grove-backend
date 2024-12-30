import { Request, Response } from "express";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { v2 as cloudinary } from 'cloudinary';
import { IBook } from "../interfaces/IBook";
import { Types } from "mongoose";
import path from "path";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";

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

const sanitizePublicId = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9-_أ-ي]/g, '_');
};

// API to upload book
export const uploadBook = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        if ((req as any).fileValidationError) {
            return throwError({message: (req as any).fileValidationError, res, status: 400});
        }

        const { title, author, description } = req.body;
        if (!title || !author || !description) {
            return throwError({ message: 'All required fields must be filled.', res, status: 400 });
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const coverImage = files.coverImage?.[0];
        const bookFile = files.bookFile?.[0];

        if (!coverImage || !bookFile) {
            return throwError({ message: 'Cover image and book file are required.', res, status: 400 });
        }

        // Sanitize the public_id for the cover image
        const sanitizedCoverImagePublicId = `covers/${Date.now()}-${sanitizePublicId(path.basename(coverImage.originalname, path.extname(coverImage.originalname)))}`;

        // Upload cover image to Cloudinary
        const coverImageResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ 
                resource_type: 'image',
                public_id: sanitizedCoverImagePublicId
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            stream.end(coverImage.buffer);
        });

        // Sanitize the public_id for the book file
        const sanitizedPublicId = `books/${Date.now()}-${sanitizePublicId(path.basename(bookFile.originalname, path.extname(bookFile.originalname)))}${path.extname(bookFile.originalname)}`;

        // Upload book file to Cloudinary with a specific name
        const bookFileResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({
                resource_type: 'raw',
                public_id: sanitizedPublicId
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            stream.end(bookFile.buffer);
        });

        const newBook: IBook = {
            _id: new Types.ObjectId(),
            title,
            author,
            description,
            coverImage: (coverImageResult as any).secure_url,
            bookFile: (bookFileResult as any).secure_url,
            uploadedAt: new Date(),
        } as IBook;

        req.user.books.push(newBook);
        await req.user.save();
        res.status(201).json({ message: 'Book uploaded successfully', book: newBook });

    } catch (error) {
        console.error('Error uploading book:', error);
        return throwError({ message: 'Error uploading book', res, status: 500 });
    }
};

// API to get user books
export const getUserBooks = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const books = req.user.books;
        res.status(200).json({ message: 'Books retrieved successfully', books });
    } catch (error) {
        console.error('Error retrieving books:', error);
        return throwError({ message: 'Error retrieving books', res, status: 500 });
    }
};

export const deleteBook = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { bookId, userId } = req.body;

        if(!checkId({id: bookId, res})) return;

        let user;

        if(userId && userId !== req.user._id && req.user.role !== "admin"){
            return throwError({ message: 'Forbidden', res, status: 401 });
        }

        if (userId){
            if(!checkId({id: userId, res})) return;
            user = await User.findById(userId);

            if (!user){
                return throwError({ message: "User not found", res, status: 404});
            }
        }
        else{
            user = req.user;
        }

        const bookIndex = req.user.books.findIndex(book => book.id.toString() === bookId);

        if (bookIndex === -1) {
            return throwError({ message: 'Book not found', res, status: 404 });
        }

        const book = req.user.books[bookIndex];

        // Delete cover image from Cloudinary
        await cloudinary.uploader.destroy(book.coverImage, { resource_type: 'image' });

        // Delete book file from Cloudinary
        await cloudinary.uploader.destroy(book.bookFile, { resource_type: 'raw' });

        // Remove book from user's collection
        req.user.books.splice(bookIndex, 1);
        await req.user.save();

        res.status(200).json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Error deleting book:', error);
        return throwError({ message: 'Error deleting book', res, status: 500 });
    }
};