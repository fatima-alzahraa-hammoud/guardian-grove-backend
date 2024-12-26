// get locked achievements
// get my achievements
// get Family achievements
// unlock acievement
// add achievements (for admin and AI)
// delete achievement (for admin)
// edit achievement (for admin)

import { Request, Response } from "express";
import { Achievement } from "../models/achievements.model";
import { throwError } from "../utils/error";

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