import { Request, Response } from "express";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";

//API to create goal
export const createGoal = async (req: Request, res: Response) => {
    try {
        const {userId, title, description, type, dueDate, rewards } = req.body;
        if(!checkId({id: userId, res})) return;
        
        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        if (!title || !description || !type) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }
        
        const newGoal = ({
            title,
            description,
            type,
            dueDate,
            rewards,
            tasks: [],
        });

        await User.findOneAndUpdate(
            { _id: userId },
            { $push: { goals: newGoal } },
            { new: true } 
        );

        await user.save();

        res.status(201).json({ message: 'Goal created successfully', goal: newGoal});
    } catch (err) {
        return throwError({message: "An unknown error occurred while creating goal", res, status: 500});
    }
}