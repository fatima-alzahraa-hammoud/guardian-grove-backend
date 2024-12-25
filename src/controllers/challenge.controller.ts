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
};

export const getAllChallenges = async(req: Request, res: Response) => {
    try{
        const { adventureId } = req.body;
        if(!checkId({id: adventureId, res})) return;

        const adventure = await Adventure.findById(adventureId);
    
        if (!adventure) 
            return throwError({ message: "Adventure not found", res, status: 404});
    
        res.status(200).json(adventure.challenges);    
    }catch(error){
        return throwError({ message: "An unknown error occurred while getting all challenges.", res, status: 500 });
    }
}

export const getChallengeById = async(req: Request, res: Response) => {
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

        res.status(200).json(challenge);    
    }catch(error){
        return throwError({ message: "An unknown error occurred while getting all challenges.", res, status: 500 });
    }
}