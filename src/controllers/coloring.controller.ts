import { Response } from "express";
import { v2 as cloudinary } from 'cloudinary';
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import path from "path";
import { IColoring } from "../interfaces/IColoring";
import { sanitizePublicId } from "../utils/sanitizePublicId";
import { checkId } from "../utils/checkId";
import { extractPublicId } from "../utils/extractPublicId";
import { User } from "../models/user.model";

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
        const coloringImage = files.imageUrl?.[0];

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

//API to get coloring images
export const getColorings = async (req: CustomRequest, res: Response): Promise<void> =>{
    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        res.status(200).json({ message: 'Colorings retrieved successfully', colorings: req.user.colorings });

    }catch(error){
        console.error('Error getting colorings:', error);
        return throwError({ message: 'Error getting colorings', res, status: 500 });
    }
}


// API to get a coloring by ID
export const getColoringById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { coloringId } = req.body;
        if(!checkId({id: coloringId, res})) return;
        
        const coloring = req.user.colorings.find(coloring => coloring.id.toString() === coloringId);

        if (!coloring) {
            return throwError({ message: 'Coloring not found', res, status: 404 });
        }

        res.status(200).json({ message: 'Coloring retrieved successfully', coloring });
    } catch (error) {
        console.error('Error retrieving coloring:', error);
        return throwError({ message: 'Error retrieving coloring', res, status: 500 });
    }
};


// API to delete a coloring
export const deleteColoring = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { coloringId } = req.body;
        if(!checkId({id: coloringId, res})) return;

        const coloringIndex = req.user.colorings.findIndex(
            (coloring) => coloring.id.toString() === coloringId
        );        
        if (coloringIndex === -1) {
            return throwError({ message: "Coloring not found", res, status: 404 });
        }

        const coloring = req.user.colorings[coloringIndex];

        const coloringImagePublicId = `colorings/${extractPublicId(coloring.imageUrl)}`;
        
        // Delete drawing image from Cloudinary
        await cloudinary.api.delete_resources([coloringImagePublicId], { resource_type: 'image' });

        const [deletedDColoring] = req.user.colorings.splice(coloringIndex, 1);
        await req.user.save();

        res.status(200).json({ message: 'Coloring deleted successfully', deletedColoring: deletedDColoring });
    } catch (error) {
        console.error('Error deleting coloring:', error);
        return throwError({ message: 'Error deleting coloring', res, status: 500 });
    }
};


//API to update colorings
export const updateColoring = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: 'Unauthorized', res, status: 401 });
        }

        const { coloringId, userId } = req.params;

        if(!checkId({id: coloringId, res})) return;

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
        const coloringImage = files?.imageUrl?.[0];

        const coloring = user.colorings.find(color => color.id.toString() === coloringId);

        if (!coloring) {
            return throwError({ message: 'Coloring not found', res, status: 404 });
        }

        if (title) coloring.title = title;

        if (coloringImage) {
            // Delete old drawing image from Cloudinary
            const coloringImagePublicId = `colorings/${extractPublicId(coloring.imageUrl)}`;
            const image = await cloudinary.api.delete_resources([coloringImagePublicId]);

            // Upload new cover image to Cloudinary
            const sanitizedColoringImagePublicId = `colorings/${Date.now()}-${sanitizePublicId(path.basename(coloringImage.originalname, path.extname(coloringImage.originalname)))}`;
            const coloringImageResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    resource_type: 'image',
                    public_id: sanitizedColoringImagePublicId
                }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
                stream.end(coloringImage.buffer);
            });

            coloring.imageUrl = (coloringImageResult as any).secure_url;
        }

        await user.save();

        res.status(200).json({ message: 'Coloring updated successfully', updatedColoring: coloring });
    } catch (error) {
        console.error('Error updating coloring', error);
        return throwError({ message: 'Error updating coloring', res, status: 500 });
    }
};