import { Request, Response } from 'express';
import { Adventure } from "../models/adventure.model";
import { IAdventure } from '../interfaces/IAdventure';

// API to create new adventure
export const createAdventure = async (req: Request, res: Response) => {
    try {

        const data = req.body;

        const { title, description, starsReward, coinsReward } = data;

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

    }
};

