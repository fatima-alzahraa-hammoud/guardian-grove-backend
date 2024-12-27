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

        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $push: { goals: newGoal } },
            { new: true }
        );

        if (!updatedUser) {
            return throwError({ message: "Failed to update user goals.", res, status: 500 });
        }

        res.status(201).json({ message: 'Goal created successfully', goal: newGoal});
    } catch (err) {
        return throwError({message: "An unknown error occurred while creating goal", res, status: 500});
    }
}

//API to get goals of the user/users
export const getGoals = async (req: CustomRequest, res: Response) => {
    try {
        const {userId} = req.body;
        
        if (userId) {
            if(!checkId({id: userId, res})) return;
            const user = await User.findById(userId);

            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            res.status(200).json({message: "Retrieving user goals successfully", goals: user.goals });
            return;
        }

        if(!req.user || req.user.role !== 'admin'){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        const users = await User.find();
        if (!users || users.length === 0) {
            return throwError({ message: "No users in the database", res, status: 404 });
        }

        const allGoals = users.map(user => ({
            userId: user._id,
            goals: user.goals
        }));


        res.status(200).json({message: "Retrieving all users' goals successfully", goals: allGoals });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error retrieving goals", res, status: 500 });
    }
};

//API to get Goal of specific Id
export const getGoalById = async (req: CustomRequest, res: Response) => {
    try {

        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const {userId, goalId} = req.body;

        if(!checkId({id: goalId, res})) return;

        if(userId && (req.user.role === 'parent' || req.user.role === 'admin' || req.user.role === 'owner')){
            if(!checkId({id: userId, res})) return;
            const user = await User.findById(userId);
            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            const goal = user.goals.find(goal => goal._id.toString() === goalId);
            if (!goal) {
                return throwError({ message: "Gole not found", res, status: 404 });
            }

            res.status(200).json({message: "Retrieving user goal successfully", goal: goal });
            return;
        }

        const goal = req.user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            return throwError({ message: "Gole not found", res, status: 404 });
        }

        res.status(200).json({message: "Retrieving your goal successfully", goal: goal });        

    } catch (err) {
        return throwError({ message: "Error retrieving goal", res, status: 500 });
    }
}


//API to update goal
export const updateGoal = async (req: CustomRequest, res: Response) => {
    try {

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { userId, goalId, title, description, type, dueDate, rewards } = req.body;

        if(!checkId({id: userId, res})) return;
        if(!checkId({id: goalId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            return throwError({ message: "Goal not found", res, status: 404 });
        }

        goal.title = title || goal.title;
        goal.description = description || goal.description;
        goal.type = type || goal.type;
        goal.dueDate = dueDate || goal.dueDate;
        if (rewards) {
            goal.rewards.stars = rewards.stars || goal.rewards.stars;
            goal.rewards.coins = rewards.coins || goal.rewards.coins;
            goal.rewards.badge = rewards.badge || goal.rewards.badge;
        }

        await user.save();

        res.status(200).json({ message: "Goal updated", goal });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error updating goal", res, status: 500 });
    }
};

//API to delete goal
export const deleteGoal = async (req: CustomRequest, res: Response) => {
    try {

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { userId, goalId } = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: userId, res})) return;


        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goalIndex = user.goals.findIndex(
            (goal) => goal._id.toString() === goalId
        );        
        if (goalIndex === -1) {
            return throwError({ message: "Goal not found", res, status: 404 });
        }

        const [deletedGoal] = user.goals.splice(goalIndex, 1);

        await user.save();

        res.status(200).json({ message: 'Goal deleted successfully', DeletedGoal: deletedGoal });
    } catch (error) {
        console.error(error);
        return throwError({message: "Error deleting goal", res, status: 500});
    }
};