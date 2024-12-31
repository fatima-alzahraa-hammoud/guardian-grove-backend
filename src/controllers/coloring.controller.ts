import { Response } from "express";
import { v2 as cloudinary } from 'cloudinary';
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import path from "path";
import { IColoring } from "../interfaces/IColoring";
import { sanitizePublicId } from "../utils/sanitizePublicId";

//API to create and save coloring
export const createColoring = async (req: CustomRequest, res: Response): Promise<void> =>{
    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { title } = req.body;

        if (!title) {
            return throwError({ message: "Title is required", res, status: 400});
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const coloringImage = files.coloringImage?.[0];

        if (!coloringImage) {
            return throwError({ message: 'Coloring image is required.', res, status: 400 });
        }

        // Sanitize the public_id for the drawing image
        const sanitizedColoringImagePublicId = `colorings/${Date.now()}-${sanitizePublicId(path.basename(coloringImage.originalname, path.extname(coloringImage.originalname)))}`;


        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ 
                resource_type: 'image',
                public_id: sanitizedColoringImagePublicId
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });

            stream.end(coloringImage.buffer);
        });


        const newColoringImage = {
            title,
            imageUrl : (result as any).secure_url,
            createdAt: new Date()
        } as IColoring;

        req.user.colorings.push(newColoringImage);
        await req.user.save();

        res.status(201).json({ message: 'Coloring Image created successfully', newColoringImage });

    }catch(error){
        console.error('Error creating coloring image:', error);
        return throwError({ message: 'Error creating coloring image', res, status: 500 });
    }
}