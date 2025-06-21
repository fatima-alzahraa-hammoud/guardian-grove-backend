import { Request, Response } from 'express';
import { Adventure } from "../models/adventure.model";
import { throwError } from '../utils/error';
import mongoose from 'mongoose';
import { checkId } from '../utils/checkId';
import { IChallenge } from '../interfaces/IChallenge';

// API to create challenges
export const createChallenge = async(req: Request, res: Response): Promise<void> => {
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
        } as IChallenge;

        adventure.challenges.push(challenge);
        await adventure.save();
        res.status(201).json({ message: 'Challenge created successfully', Challenge: challenge});
    }catch(error) {
        return throwError({ message: "An unknown error occurred while creating.", res, status: 500 });
    }
};

// API to get all challenges
export const getAllChallenges = async(req: Request, res: Response): Promise<void> => {
    try{
        const { adventureId } = req.body;
        if(!checkId({id: adventureId, res})) return;

        const adventure = await Adventure.findById(adventureId);
    
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});
    
        res.status(200).json({ message: 'Retrieving challenges successfully', Challenges: adventure.challenges});
    }catch(error){
        return throwError({ message: "An unknown error occurred while getting all challenges.", res, status: 500 });
    }
}

// API to get challenges by id
export const getChallengeById = async(req: Request, res: Response): Promise<void> => {
    try{
        const { adventureId, challengeId } = req.body;
        if(!checkId({id: adventureId, res})) return;
        if(!checkId({id: challengeId, res})) return;


        const adventure = await Adventure.findById(adventureId);
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});
    
        const challenge = adventure.challenges.find(chal => chal._id.toString() === challengeId);
        if (!challenge) {
            return throwError({ message: "Challenge not found", res, status: 404 });
        }

        res.status(200).json({ message: 'Retrieving challenge successfully', Challenges: challenge});
    }catch(error){
        return throwError({ message: "An unknown error occurred while getting challenge.", res, status: 500 });
    }
}

// API to update challenges
export const updateChallenge = async(req: Request, res: Response): Promise<void> => {
    try{
        const { adventureId, challengeId } = req.body;
        if(!checkId({id: adventureId, res})) return;
        if(!checkId({id: challengeId, res})) return;

        const updateData = { ...req.body };
        delete updateData.adventureId;
        delete updateData.challengeId;

        if (Object.keys(updateData).length === 0) {
            return throwError({ message: "No other data provided to update", res, status: 400 });
        }

        const adventure = await Adventure.findById(adventureId);
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});
    
        const challenge = adventure.challenges.find(chal => chal._id.toString() === challengeId);
        if (!challenge) {
            return throwError({ message: "Challenge not found", res, status: 404 });
        }

        Object.assign(challenge, updateData);

        await adventure.save();
        res.status(200).json({ message: 'Updating challenge successfully', Challenges: challenge});

    }catch(error){
        return throwError({ message: "An unknown error occurred while updating challenge.", res, status: 500 });
    }
};

// API to delete challenge
export const deleteChallenge = async(req:Request, res: Response): Promise<void> => {
    try {

        const {adventureId, challengeId} = req.body;

        if(!checkId({id: adventureId, res})) return;
        if(!checkId({id: challengeId, res})) return;

        const adventure = await Adventure.findById(adventureId);
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});

        const challengeIndex = adventure.challenges.findIndex(chal => chal._id.toString() === challengeId);
        if (challengeIndex === -1) 
            return throwError({ message: "Challenge not found", res, status: 404 });

        // Remove the challenge from the array
        adventure.challenges.splice(challengeIndex, 1);

        await adventure.save();

        res.status(200).json({ message: "Challenge deleted successfully", adventure });
    } catch (error) {
        return throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
}