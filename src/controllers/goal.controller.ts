import { Request, Response } from "express";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";

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

//API to get goals of the user/users
export const getGoals = async (req: Request, res: Response) => {
    try {
        const {userId} = req.body;
        if(!checkId({id: userId, res})) return;
        
        if (userId) {
            const user = await User.findById(userId);

            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            res.status(200).json({message: "Retrieving goals successfully", goals: user.goals });
            return;
        }
        const users = await User.find();
        if (!users || users.length === 0) {
            return throwError({ message: "No users in the database", res, status: 404 });
        }

        const allGoals = users.map(user => ({
            userId: user._id,
            goals: user.goals
        }));


        res.status(200).json({message: "Retrieving goals successfully", goals: allGoals });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error retrieving goals", res, status: 500 });
    }
};
