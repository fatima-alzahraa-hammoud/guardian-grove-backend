import { Request, Response } from 'express';
import { Adventure } from "../models/adventure.model";
import { throwError } from '../utils/error';
import mongoose from 'mongoose';
import { checkId } from '../utils/checkId';
import { IChallenge } from '../interfaces/IChallenge';

// API to create challenges
export const createChallenge = async(req: Request, res: Response) => {
    try{
        const {adventureId, title, content, starsReward, coinsReward} = req.body;

        if(!checkId({id: adventureId, res})) return;

        const adventure = await Adventure.findById(adventureId);
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});

        if (!title || !content) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const challenge = {
            title,
            content,
            starsReward: starsReward || 2,
            coinsReward: coinsReward || 1,
            isCompleted: false
        } as IChallenge;

        adventure.challenges.push(challenge);
        await adventure.save();
        res.status(201).json(challenge);
    }catch(error) {
        return throwError({ message: "An unknown error occurred while creating.", res, status: 500 });
    }
}