import { Request, Response } from 'express';
import { Adventure } from "../models/adventure.model";
import { IAdventure } from '../interfaces/IAdventure';
import { throwError } from '../utils/error';

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

        const adventure = await newAdventure.save();
        res.status(201).json({message: "Adventure created successfully", adventure: newAdventure});
    } catch (error) {
        throwError({ message: "An unknown error occurred.", res, status: 500 });
    }
};

