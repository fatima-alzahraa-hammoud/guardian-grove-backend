// get Family achievements

import { Request, Response } from "express";
import { Achievement } from "../models/achievements.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { checkId } from "../utils/checkId";
import { IAchievement } from "../interfaces/IAchievements";
import { User } from "../models/user.model";

// API to create new achievement
export const createAchievement = async (req: Request, res: Response): Promise<void> => {
    try {

        const data = req.body;

        const { title, description, starsReward, coinsReward, criteria, photo } = data;
        if (!title || !description || !criteria || !photo) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newAchievement: IAchievement = new Achievement({
            title,
            description,
            starsReward: starsReward || 0,
            coinsReward: coinsReward || 0, 
            criteria,
            photo
        });

        await newAchievement.save();

        res.status(201).json({message: "Achievement created successfully", Achievement: newAchievement});
    } catch (error) {
        return throwError({ message: "An unknown error occurred.", res, status: 500 });
    }
};

//API to update achievement
export const updateAchievement = async (req: Request, res: Response): Promise<void> => {
    try{

        const {achievementId} = req.body;

        if(!checkId({id: achievementId, res})) return;

        const updateData = { ...req.body };
        delete updateData.achievementId; // Remove achievementId from the body for comparison

        if (Object.keys(updateData).length === 0) {
            return throwError({ message: "No other data provided to update", res, status: 400 });
        }

        const achievement = await Achievement.findByIdAndUpdate(achievementId, req.body, {new: true, runValidators: true});

        if(!achievement){
            return throwError({ message: "Achievement not found", res, status: 404});
        }

        res.status(200).json({message: "Achievement Updated Successfully", achievement});

    }catch(error){
        return throwError({ message: "Failed to update. An unknown error occurred.", res, status: 500 });
    }
};

// API to delete adventure
export const deleteAchievement = async(req:Request, res: Response): Promise<void> => {
    try {
        const {achievementId} = req.body;

        if(!checkId({id: achievementId, res})) return;

        const achievement = await Achievement.findByIdAndDelete(achievementId);
        if (!achievement) 
            return throwError({ message: "Achievement not found", res, status: 404});

        await User.updateMany(
            { 'achievements.achievementId': achievementId },
            { $pull: { achievements: { achievementId } } }
        );


        res.status(200).json({ message: "Achievement deleted successfully", achievement });
    } catch (error) {
        return throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
}

// API to get all achievements
export const getAllAchievements = async (req: Request, res: Response): Promise<void> => {
    try {
        const achievements = await Achievement.find();

        if(!achievements){
            return throwError({message: "No achievements found", res, status: 400});
        }

        res.status(200).json({message: "Getting all achievements Successfully", achievements});
    } catch (error) {
        return throwError({ message: "An unknown error occurred while getting all achievements.", res, status: 500 });
    }
};

// API to get locked achievements
export const getLockedAchievements = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;

        const allAchievements = await Achievement.find();
        const lockedAchievements = allAchievements.filter(
            (achievement) => !user.achievements.some(
                (userAchievement) => userAchievement.achievementId.toString() === achievement._id.toString()
            )
        );

        res.status(200).json({message: "Getting locked achievements Successfully", achievements: lockedAchievements });
    } catch (error) {
        throwError({ message: "An error occurred while fetching locked achievements.", res, status: 500 });
    }
};

//API to get user achievements
export const getUserAchievements = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;
        
        await user.populate({
            path: 'achievements.achievementId',
            select: 'title description photo'
        });

        res.status(200).json({message: "Getting user achievements Successfully", achievements: user.achievements });
    } catch (error) {
        throwError({ message: "An error occurred while fetching user achievements.", res, status: 500 });
    }
};

//API to unlock an achievement
export const unlockAchievement = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { achievementId } = req.body;

        if(!checkId({id: achievementId, res})) return;
    

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;

        // Check if the achievementId exists in the Achievement collection
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return throwError({ message: "Achievement not found", res, status: 404 });
        }

        // Check if the achievement is already unlocked
        const existingAchievement = user.achievements.find(
            (achievement) => achievement.achievementId.toString() === achievementId
        );

        if (existingAchievement) {
            return throwError({ message: "Achievement already unlocked", res, status: 400 });
        }

        // Unlock the achievement
        const unlockedAchievement = {
            achievementId,
            unlockedAt: new Date(),
        };

        user.achievements.push(unlockedAchievement);
        await user.save();

        res.status(200).json({ message: "Achievement unlocked successfully", unlockedAchievement });
    } catch (error) {
        return throwError({ message: "An error occurred while unlocking the achievement.", res, status: 500 });
    }
};