import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { IDrawing } from "../interfaces/IDrawing";
import path from "path";

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
        const sanitizedDrawingImagePublicId = `covers/${Date.now()}-${sanitizePublicId(path.basename(drawingImage.originalname, path.extname(drawingImage.originalname)))}`;


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