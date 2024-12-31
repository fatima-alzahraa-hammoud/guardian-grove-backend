import { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';
import { CustomRequest } from "../interfaces/customRequest";
import { throwError } from "../utils/error";
import { IDrawing } from "../interfaces/IDrawing";

//API to create and save drawing
export const createDrawing = async (req: CustomRequest, res: Response): Promise<void> =>{
    try{
        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { title, drawing } = req.body;

        if (!title || !drawing) {
            return throwError({ message: "Title and drawing are required", res, status: 400});
        }

        const result = await cloudinary.uploader.upload(drawing, {
            folder: 'drawings',
            resource_type: 'image'
        });

        const newDrawing = {
            title,
            drawing : result.secure_url,
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