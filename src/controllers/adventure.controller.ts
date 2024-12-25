import { Request, Response } from 'express';
import { Adventure } from "../models/adventure.model";
import { IAdventure } from '../interfaces/IAdventure';
import { throwError } from '../utils/error';
import { CustomRequest } from '../interfaces/customRequest';

// API to create new adventure
export const createAdventure = async (req: Request, res: Response):Promise<void> => {
    try {

        const data = req.body;

        const { title, description, starsReward, coinsReward } = data;
        if (!title || !description) {
            throwError({ message: "All required fields must be filled.", res, status: 400});
            return;
        }

        const newAdventure: IAdventure = new Adventure({
            title,
            description,
            starsReward: starsReward || 10,
            coinsReward: coinsReward || 5, 
            challenges: [], 
        });

        await newAdventure.save();

        res.status(201).json({message: "Adventure created successfully", adventure: newAdventure});
    } catch (error) {
        throwError({ message: "An unknown error occurred.", res, status: 500 });
    }
};

// Get all adventures
export const getAllAdventures = async (req: Request, res: Response) => {
    try {
        const adventures = await Adventure.find();

        if(!adventures){
            throwError({message: "No adventures found", res, status: 400});
        }

        res.status(200).json({message: "Getting all adventures Successfully", adventures});
    } catch (error) {
        throwError({ message: "An unknown error occurred while getting all adventures.", res, status: 500 });
    }
};
