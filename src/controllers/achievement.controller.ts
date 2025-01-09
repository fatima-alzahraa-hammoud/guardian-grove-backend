// get Family achievements

import { Request, Response } from "express";
import { Achievement } from "../models/achievements.model";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { checkId } from "../utils/checkId";
import { IAchievement } from "../interfaces/IAchievements";
import { User } from "../models/user.model";
import { Family } from "../models/family.model";

// API to create new achievement
export const createAchievement = async (req: Request, res: Response): Promise<void> => {
    try {

        const data = req.body;

        const { title, description, starsReward, coinsReward, criteria, photo, type } = data;
        if (!title || !description || !criteria || !photo) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newAchievement: IAchievement = new Achievement({
            title,
            description,
            starsReward: starsReward || 0,
            coinsReward: coinsReward || 0, 
            criteria,
            photo,
            type: type || 'personal'
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

        await Family.updateMany(
            { 'achievements.achievementId': achievementId },
            { $pull: { achievements: { achievementId } } }
        );

        res.status(200).json({ message: "Achievement deleted successfully", achievement });
    } catch (error) {
        return throwError({ message: "Failed to delete. An unknown error occurred.", res, status: 500 });
    }
}

// API to get all achievements
export const getAchievements = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type } = req.query;
        
        let query: Record<string, any> = {};

        if (type && type !== "All") {
            query.type = type; 
        }

        const achievements = await Achievement.find(query);

        if (achievements.length === 0) {
            return throwError({message: "No achievements found", res, status: 404});
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

        const personalUnlockedAchievements = user.achievements.map((userAchievement) => 
            userAchievement.achievementId.toString()
        );

        const family = await Family.findById(user.familyId);
        
        const familyUnlockedAchievements = family ? family.achievements.map((familyAchievement) => 
            familyAchievement.achievementId.toString()
        ) : [];

        const unlockedAchievements = [...personalUnlockedAchievements, ...familyUnlockedAchievements];

        const lockedAchievements = await Achievement.find({
            _id: { $nin: unlockedAchievements },
        });

        res.status(200).json({message: "Getting locked achievements Successfully", achievements: lockedAchievements });
    } catch (error) {
        throwError({ message: "An error occurred while fetching locked achievements.", res, status: 500 });
    }
};

// API to get unlocked achievements
export const getUnLockedAchievements = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const user = req.user;
        
        const personalUnlockedAchievements = user.achievements.map((userAchievement) => 
            userAchievement.achievementId.toString()
        );

        const family = await Family.findById(user.familyId);
        
        const familyUnlockedAchievements = family ? family.achievements.map((familyAchievement) => 
            familyAchievement.achievementId.toString()
        ) : [];

        const unlockedAchievementIds = [
            ...personalUnlockedAchievements, 
            ...familyUnlockedAchievements
        ];

        const unlockedAchievements = await Achievement.find({
            _id: { $in: unlockedAchievementIds }
        });

        res.status(200).json({message: "Getting locked achievements Successfully", achievements: unlockedAchievements });
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

        if(achievement.type !== "personal"){
            return throwError({ message: "It is not personal achievement", res, status: 400 });
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

//API to unlock family achievement
export const unlockFamilyAchievement = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        
        const { familyId, achievementId } = req.body;

        if(!checkId({id: achievementId, res})) return;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        // Check if the achievementId exists in the Achievement collection
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) {
            return throwError({ message: "Achievement not found", res, status: 404 });
        }

        // Check if the achievement is already unlocked
        const existingAchievement = family.achievements.find(
            (achievement) => achievement.achievementId.toString() === achievementId
        );

        if (existingAchievement) {
            return throwError({ message: "Achievement already unlocked", res, status: 400 });
        }

        if(achievement.type !== "family"){
            return throwError({ message: "It is not family achievement", res, status: 400 });
        }

        // Unlock the achievement
        const unlockedAchievement = {
            achievementId,
            unlockedAt: new Date(),
        };

        family.achievements.push(unlockedAchievement);
        await family.save();

        res.status(200).json({ message: "Achievement unlocked successfully", unlockedAchievement });
    } catch (error) {
        return throwError({ message: "An error occurred while unlocking the achievement.", res, status: 500 });
    }
};

//API to get last unlockedAchievement

export const getLastUnlockedAchievement = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {userId} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const targetUserId = userId || req.user._id;

        if (!checkId({ id: targetUserId, res })) return;

        const isAuthorized = req.user._id.toString() === targetUserId.toString() || ['parent', 'admin', 'owner'].includes(req.user.role);
        if (!isAuthorized) {
            return throwError({ message: "Forbidden", res, status: 403 });
        }

        const user = await User.findById(targetUserId).populate({
            path: "achievements.achievementId",
            select: "title photo description"
        });

        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        if (user.achievements.length === 0) {
            res.status(404).json({ message: "No achievements unlocked yet." });
            return;
        }

        const lastUnlocked = user.achievements[user.achievements.length - 1];

        const achievementDetails = {
            title: (lastUnlocked.achievementId as any).title,
            photo: (lastUnlocked.achievementId as any).photo,
            description: (lastUnlocked.achievementId as any).description,
            unlockedAt: lastUnlocked.unlockedAt,
        };
        
        res.status(200).send({message: 'Retrieve unlocked achievement successfully', lastUnlockedAchievement: achievementDetails});
    } catch (error) {
        console.error("Error fetching last unlocked achievement:", error);
        res.status(500).json({ message: "Server error" });
    }
};