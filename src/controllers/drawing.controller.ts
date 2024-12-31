import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { IDrawing } from "../interfaces/IDrawing";
import path from "path";
import { checkId } from "../utils/checkId";
import { User } from "../models/user.model";

const extractPublicId = (url: string): string => {
    const parts = url.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    return publicId;
};

const sanitizePublicId = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9-_أ-ي]/g, '_');
};

//API to create and save drawing
export const createDrawing = async (req: CustomRequest, res: Response): Promise<void> =>{
    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { title } = req.body;

        if (!title) {
            return throwError({ message: "Title and drawing are required", res, status: 400});
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const drawingImage = files.drawing?.[0];

        if (!drawingImage) {
            return throwError({ message: 'Drawing image is required.', res, status: 400 });
        }

        // Sanitize the public_id for the drawing image
        const sanitizedDrawingImagePublicId = `drawings/${Date.now()}-${sanitizePublicId(path.basename(drawingImage.originalname, path.extname(drawingImage.originalname)))}`;


        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ 
                resource_type: 'image',
                public_id: sanitizedDrawingImagePublicId
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            stream.end(drawingImage.buffer);
        });


        const newDrawing = {
            title,
            drawing : (result as any).secure_url,
            createdAt: new Date()
        } as IDrawing;

        req.user.drawings.push(newDrawing);
        await req.user.save();

        res.status(201).json({ message: 'Drawing created successfully', newDrawing });

    }catch(error){
        console.error('Error creating drawing:', error);
        return throwError({ message: 'Error creating drawing', res, status: 500 });
    }
}

// API to get all drawings
export const getDrawings = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        res.status(200).json({ message: 'Drawings retrieved successfully', drawings: req.user.drawings });
    } catch (error) {
        console.error('Error retrieving drawings:', error);
        return throwError({ message: 'Error retrieving drawings', res, status: 500 });
    }
};

// API to get a drawing by ID
export const getDrawingById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { drawingId } = req.body;
        if(!checkId({id: drawingId, res})) return;
        
        const drawing = req.user.drawings.find(drawing => drawing.id.toString() === drawingId);

        if (!drawing) {
            return throwError({ message: 'Drawing not found', res, status: 404 });
        }

        res.status(200).json({ message: 'Drawing retrieved successfully', drawing });
    } catch (error) {
        console.error('Error retrieving drawing:', error);
        return throwError({ message: 'Error retrieving drawing', res, status: 500 });
    }
};


// API to delete a drawing
export const deleteDrawing = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { drawingId } = req.body;
        if(!checkId({id: drawingId, res})) return;

        const drawingIndex = req.user.drawings.findIndex(
            (drawing) => drawing.id.toString() === drawingId
        );        
        if (drawingIndex === -1) {
            return throwError({ message: "Drawing not found", res, status: 404 });
        }

        const drawing = req.user.drawings[drawingIndex];

        const drawingImagePublicId = `drawings/${extractPublicId(drawing.drawing)}`;
        console.log(drawingImagePublicId);
        
        // Delete drawing image from Cloudinary
        await cloudinary.api.delete_resources([drawingImagePublicId], { resource_type: 'image' });

        const [deletedDrawing] = req.user.drawings.splice(drawingIndex, 1);
        await req.user.save();

        res.status(200).json({ message: 'Drawing deleted successfully', deletedDrawing: deletedDrawing });
    } catch (error) {
        console.error('Error deleting drawing:', error);
        return throwError({ message: 'Error deleting drawing', res, status: 500 });
    }
};


//API to update book
export const updateDrawing = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { drawingId, userId } = req.params;

        if(!checkId({id: drawingId, res})) return;

        let user;

        if(userId && userId !== req.user._id.toString() && req.user.role !== "admin"){
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

        const { title } = req.body;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const drawingImage = files?.drawing?.[0];

        const drawing = user.drawings.find(draw => draw.id.toString() === drawingId);

        if (!drawing) {
            return throwError({ message: 'Drawing not found', res, status: 404 });
        }

        if (title) drawing.title = title;

        if (drawingImage) {
            // Delete old drawing image from Cloudinary
            const drawingImagePublicId = `drawings/${extractPublicId(drawing.drawing)}`;
            const image = await cloudinary.api.delete_resources([drawingImagePublicId]);

            // Upload new cover image to Cloudinary
            const sanitizedDrawingImagePublicId = `covers/${Date.now()}-${sanitizePublicId(path.basename(drawingImage.originalname, path.extname(drawingImage.originalname)))}`;
            const drawingImageResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    resource_type: 'image',
                    public_id: sanitizedDrawingImagePublicId
                }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
                stream.end(drawingImage.buffer);
            });

            drawing.drawing = (drawingImageResult as any).secure_url;
        }

        await user.save();

        res.status(200).json({ message: 'Drawing updated successfully', updatedDrawing: drawing });
    } catch (error) {
        console.error('Error updating drawing:', error);
        return throwError({ message: 'Error updating drawing', res, status: 500 });
    }
};