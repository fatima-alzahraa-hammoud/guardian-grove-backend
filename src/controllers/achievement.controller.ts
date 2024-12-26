// get Family achievements
// unlock acievement
// add achievements (for admin and AI)
// delete achievement (for admin)
// edit achievement (for admin)

import { Request, Response } from "express";
import { Achievement } from "../models/achievements.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { checkId } from "../utils/checkId";

// API to get all achievements
export const getAllAchievements = async (req: Request, res: Response) => {
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
export const getLockedAchievements = async (req: CustomRequest, res: Response) => {
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
export const getUserAchievements = async (req: CustomRequest, res: Response) => {
    try {
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;
        
        await user.populate({
            path: 'achievements.achievementId',
            select: 'title description'
        });

        res.status(200).json({message: "Getting user achievements Successfully", achievements: user.achievements });
    } catch (error) {
        throwError({ message: "An error occurred while fetching user achievements.", res, status: 500 });
    }
};

//API to unlock an achievement
export const unlockAchievement = async (req: CustomRequest, res: Response) => {
    try {
        const { achievementId } = req.body;

        if(!checkId({id: achievementId, res})) return;
    

        if (!req.user) {
            throwError({ message: "Unauthorized", res, status: 401 });
            return;
        }

        const user = req.user;

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