import { Request, Response } from 'express';
import { Adventure } from "../models/adventure.model";
import { IAdventure } from '../interfaces/IAdventure';
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';
import mongoose from 'mongoose';
import { checkId } from '../utils/checkId';

// API to create new adventure
export const createAdventure = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;

        const { title, description, starsReward, coinsReward } = data;
        
        // Trim whitespace and check if fields are empty
        const trimmedTitle = title?.trim();
        const trimmedDescription = description?.trim();
        
        if (!trimmedTitle || !trimmedDescription) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newAdventure: IAdventure = new Adventure({
            title: trimmedTitle,
            description: trimmedDescription,
            starsReward: starsReward || 10,
            coinsReward: coinsReward || 5, 
            challenges: [], 
        });

        await newAdventure.save();

        res.status(201).json({message: "Adventure created successfully", adventure: newAdventure});
    } catch (error) {
        return throwError({ message: "An unknown error occurred.", res, status: 500 });
    }
};

// Get all adventures
export const getAllAdventures = async (req: Request, res: Response): Promise<void> => {
    try {
        const adventures = await Adventure.find();

        if(!adventures){
            return throwError({message: "No adventures found", res, status: 400});
        }

        res.status(200).json({message: "Getting all adventures Successfully", adventures});
    } catch (error) {
        return throwError({ message: "An unknown error occurred while getting all adventures.", res, status: 500 });
    }
};

// Get adventure by ID
export const getAdventureById = async (req: Request, res: Response): Promise<void> => {
    try {
        const {adventureId} = req.body;

        if(!checkId({id: adventureId, res})) return;

        const adventure = await Adventure.findById(adventureId);
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});
        res.status(200).json(adventure);
    } catch (error) {
        return throwError({ message: "An unknown error occurred while getting the adventure.", res, status: 500 });
    }
};

export const updateAdventure = async (req: Request, res: Response): Promise<void> => {
    try{

        const {adventureId} = req.body;

        if(!checkId({id: adventureId, res})) return;

        const updateData = { ...req.body };
        delete updateData.adventureId; // Remove adventureId from the body for comparison

        if (Object.keys(updateData).length === 0) {
            return throwError({ message: "No other data provided to update", res, status: 400 });
        }

        const adventure = await Adventure.findByIdAndUpdate(adventureId, req.body, {new: true, runValidators: true});

        if(!adventure){
            return throwError({ message: "Adventure not found", res, status: 404});
        }

        res.status(200).json({message: "Adventure Updated Successfully", adventure});

    }catch(error){
        return throwError({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
}

export const deleteAdventure = async(req:Request, res: Response): Promise<void> => {
    try {

        const {adventureId} = req.body;

        if(!checkId({id: adventureId, res})) return;

        const adventure = await Adventure.findByIdAndDelete(adventureId);
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});

        res.status(200).json({ message: "Adventure deleted successfully", adventure });
    } catch (error) {
        return throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
}