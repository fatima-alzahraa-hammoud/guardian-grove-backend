import { Request, Response } from "express";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { ITask } from "../interfaces/ITask";
import { Achievement } from "../models/achievements.model";
import { Family } from "../models/family.model";
import { IGoal } from "../interfaces/IGoal";

//API to create goal
export const createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        let {familyId, userId, title, description, type, dueDate, rewards } = req.body;

        if (!title || !description) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        if(!type){
            type = 'personal';
        }

        if (rewards?.achievementId) {
            const achievement = await Achievement.findById(rewards.achievementId);
            if (!achievement) {
                return throwError({ message: "Achievement not found.", res, status: 404 });
            }
            rewards.achievementName = achievement.title;
        }
        
        const newGoal = ({
            title,
            description,
            type,
            dueDate,
            rewards,
            tasks: [],
        });

        if (type === "personal"){
            if(!checkId({id: userId, res})) return;
            
            const user = await User.findById(userId);
            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }
            const updatedUser = await User.findOneAndUpdate(
                { _id: userId },
                { $push: { goals: newGoal } },
                { new: true }
            );

            if (!updatedUser) {
                return throwError({ message: "Failed to update user goals.", res, status: 500 });
            }
        }
        else{
            if(!checkId({id: familyId, res})) return;

            const family = await Family.findById({_id: familyId});
            if(!family){
                return throwError({ message: "Family not found", res, status: 404 });
            }
            const updatedFamily = await Family.findOneAndUpdate(
                { _id: familyId },
                { $push: { goals: newGoal } },
                { new: true }
            );

            if (!updatedFamily) {
                return throwError({ message: "Failed to update family goals.", res, status: 500 });
            }
        }
        
        res.status(201).json({ message: 'Goal created successfully', goal: newGoal});
    } catch (err) {
        return throwError({message: "An unknown error occurred while creating goal", res, status: 500});
    }
}

//API to get goals of the user/users
export const getGoals = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const {userId} = req.body;
        
        if (userId) {
            if(!checkId({id: userId, res})) return;
            const user = await User.findById(userId);

            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }

            let goals = user.goals;
            const family = await Family.findById(user.familyId).populate('goals');
            if (family) {
                goals = [...goals, ...family.goals];
            }

            res.status(200).json({message: "Retrieving user goals successfully", goals: goals });
            return;
        }

        if(!req.user || req.user.role !== 'admin'){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }
        const families = await Family.find().populate('goals');
        const users = await User.find();
        if (!users || users.length === 0) {
            return throwError({ message: "No users in the database", res, status: 404 });
        }

        const allGoals = users.map(user => {
            const familyGoals = families.find(family => family._id.toString() === user.familyId?.toString())?.goals || [];
            return {
                userId: user._id,
                goals: [...user.goals, ...familyGoals],
            };
        });


        res.status(200).json({message: "Retrieving all users' goals successfully", goals: allGoals });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error retrieving goals", res, status: 500 });
    }
};

//API to get Goal of specific Id
export const getGoalById = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const {userId, goalId} = req.body;

        if(!checkId({id: goalId, res})) return;
        let user;

        if(userId && ['parent', 'admin', 'owner'].includes(req.user.role)){
            if(!checkId({id: userId, res})) return;
            user = await User.findById(userId);
            if (!user) {
                return throwError({ message: "User not found", res, status: 404 });
            }
        }else{
            user = req.user;
        }

        let goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {

            const family = await Family.findById(user.familyId).populate('goals');

            if (!family) {
                return throwError({ message: "Family not found", res, status: 404 });
            }

            goal = family.goals.find(goal => goal._id.toString() === goalId);

            if(!goal)
                return throwError({ message: "Goal not found", res, status: 404 });
        }

        res.status(200).json({message: "Retrieving your goal successfully", goal: goal });        

    } catch (err) {
        return throwError({ message: "Error retrieving goal", res, status: 500 });
    }
}


//API to update goal of a user
export const updateUserGoal = async (req: CustomRequest, res: Response): Promise<void> => {
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

        if (rewards?.achievementId) {
            const achievement = await Achievement.findById(rewards.achievementId);
            if (!achievement) {
                return throwError({ message: "Achievement not found.", res, status: 404 });
            }
            rewards.achievementName = achievement.title;
        }

        goal.title = title || goal.title;
        goal.description = description || goal.description;
        goal.type = type || goal.type;
        goal.dueDate = dueDate || goal.dueDate;
        if (rewards) {
            goal.rewards.stars = rewards.stars || goal.rewards.stars;
            goal.rewards.coins = rewards.coins || goal.rewards.coins;
            goal.rewards.achievementName = rewards.achievementName || goal.rewards.achievementName;
            goal.rewards.achievementId = rewards.achievementId || goal.rewards.achievementId;
        }

        await user.save();

        res.status(200).json({ message: "Goal updated", goal });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error updating goal", res, status: 500 });
    }
};


//API to update goal of a family
export const updateFamilyGoal = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId, goalId, title, description, type, dueDate, rewards } = req.body;

        if(!checkId({id: familyId, res})) return;
        if(!checkId({id: goalId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }
        if (req.user.role !== 'admin' && req.user.email !== family.email){
            return throwError({ message: "Forbidden", res, status: 400 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            return throwError({ message: "Goal not found", res, status: 404 });
        }

        if (rewards?.achievementId) {
            const achievement = await Achievement.findById(rewards.achievementId);
            if (!achievement) {
                return throwError({ message: "Achievement not found.", res, status: 404 });
            }
            rewards.achievementName = achievement.title;
        }

        goal.title = title || goal.title;
        goal.description = description || goal.description;
        goal.type = type || goal.type;
        goal.dueDate = dueDate || goal.dueDate;
        if (rewards) {
            goal.rewards.stars = rewards.stars || goal.rewards.stars;
            goal.rewards.coins = rewards.coins || goal.rewards.coins;
            goal.rewards.achievementName = rewards.achievementName || goal.rewards.achievementName;
            goal.rewards.achievementId = rewards.achievementId || goal.rewards.achievementId;
        }

        await family.save();

        res.status(200).json({ message: "Goal updated", goal });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error updating goal", res, status: 500 });
    }
};

//API to delete goal
export const deleteGoal = async (req: CustomRequest, res: Response): Promise<void> => {
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

// API to create task
export const createTask = async(req: Request, res: Response): Promise<void> => {
    try{
        const {userId, goalId, title, description, type, rewards} = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});

        if (!title || !description || !type) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newTask = ({
            title,
            description,
            type,
            rewards : rewards || {stars: 2, coins: 1},
        } as ITask);

        goal.tasks.push(newTask);
        await user.save();

        res.status(201).json({ message: 'Task created successfully', Task: newTask });
    }catch(error) {
        return throwError({ message: "An unknown error occurred while creating Task.", res, status: 500 });
    }
};

//API to get task by id
export const getTaskById = async(req: Request, res: Response): Promise<void> => {
    try{
        const {userId, taskId, goalId } = req.body;
        if(!checkId({id: taskId, res})) return;
        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});
    
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return throwError({ message: "Task not found", res, status: 404 });
        }

        res.status(201).json({ message: 'Retrieve task successfully', Task: task });
    }catch(error){
        return throwError({ message: "An unknown error occurred while getting task.", res, status: 500 });
    }
}

// API to update task
export const updateTask = async(req: Request, res: Response): Promise<void> => {
    try{
        const {userId, taskId, goalId, title, description, type, rewards } = req.body;
        if(!checkId({id: taskId, res})) return;
        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});
    
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return throwError({ message: "Task not found", res, status: 404 });
        }


        task.title = title || task.title;
        task.description = description || task.description;
        task.type = type || task.type;
        if (rewards) {
            task.rewards.stars = rewards.stars || task.rewards.stars;
            task.rewards.coins = rewards.coins || task.rewards.coins;
        }

        await user.save();

        res.status(200).json({ message: "Task updated successfully", task });

    }catch(error){
        return throwError({ message: "An unknown error occurred while update task.", res, status: 500 });
    }
};

//API to delete task
export const deleteTask = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { userId, goalId, taskId } = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: userId, res})) return;
        if(!checkId({id: taskId, res})) return;


        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});


        const taskIndex = goal.tasks.findIndex(
            (task) => task._id.toString() === taskId
        );        
        if (taskIndex === -1) {
            return throwError({ message: "Task not found", res, status: 404 });
        }

        const [deletedTask] = goal.tasks.splice(taskIndex, 1);

        await user.save();

        res.status(200).json({ message: 'Task deleted successfully', DeletedTask: deletedTask });
    } catch (error) {
        console.error(error);
        return throwError({message: "Error deleting task", res, status: 500});
    }
};

//API to complete task
export const completeTask = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { userId, goalId, taskId } = req.body;

        if (!checkId({ id: userId, res }) || !checkId({ id: goalId, res }) || !checkId({ id: taskId, res })) {
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) {
            return throwError({ message: "Goal not found", res, status: 404 });
        }

        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return throwError({ message: "Task not found", res, status: 404 });
        }

        // Mark the task as completed
        if (task.isCompleted) {
            return throwError({ message: "Task already completed", res, status: 400 });
        }
        task.isCompleted = true;
        user.coins += task.rewards.coins;
        user.stars += task.rewards.stars;

        goal.progress = (goal.tasks.filter(task => task.isCompleted).length / goal.tasks.length) * 100;

        // Check if all tasks in the goal are completed
        const allTasksCompleted = goal.tasks.every(task => task.isCompleted);
        if (allTasksCompleted) {
            goal.isCompleted = true;

            // Reward user with coins and stars
            user.coins += goal.rewards.coins;
            user.stars += goal.rewards.stars;

            // Unlock Achievement if available
            if (goal.rewards.achievementId) {
                const achievement = await Achievement.findById(goal.rewards.achievementId);
                if (!achievement) {
                    return throwError({ message: "Achievement not found", res, status: 404 });
                }
                user.achievements.push({achievementId: achievement._id, unlockedAt: new Date(),});

                res.status(200).json({ message: "Achievement unlocked successfully", achievement });
            }
        }

        await user.save();

        res.status(200).json({ message: "Task marked as done", task, goal });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error marking task as done", res, status: 500 });
    }
};
