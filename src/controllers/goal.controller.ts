import { Request, Response } from "express";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";
import { CustomRequest } from "../interfaces/customRequest";
import { ITask } from "../interfaces/ITask";
import { Achievement } from "../models/achievements.model";
import { Family } from "../models/family.model";
import { IGoal } from "../interfaces/IGoal";
import { startOfMonth, endOfMonth } from "date-fns";
import { recalculateFamilyMemberRanks } from "../utils/recalculateFamilyMemberRanks";
import { getTimePeriod } from "../utils/getTimePeriod";

//API to create goal
//API to create goal - UPDATED VERSION
export const createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
        let {familyId, userId, title, description, type, dueDate, rewards, tasks } = req.body;

        if (!title || !description) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        if(!type){
            type = 'personal';
        }

        // Set default rewards if not provided
        if (!rewards) {
            rewards = {
                stars: 0,
                coins: 0
            };
        }

        if (rewards?.achievementId) {
            const achievement = await Achievement.findById(rewards.achievementId);
            if (!achievement) {
                return throwError({ message: "Achievement not found.", res, status: 404 });
            }
            rewards.achievementName = achievement.title;
        }
        
        // Process tasks if they are provided (for goals created with generated tasks)
        interface ProcessedTask {
            title: string;
            description: string;
            type: string;
            rewards: {
            stars: number;
            coins: number;
            };
            createdAt: Date;
            isCompleted: boolean;
        }
        let processedTasks: ProcessedTask[] = [];
        if (tasks && Array.isArray(tasks)) {
            processedTasks = tasks.map((task: any) => ({
                title: task.title,
                description: task.description,
                type: type, // Use the same type as the goal
                rewards: task.rewards || { stars: 5, coins: 10 },
                createdAt: new Date(),
                isCompleted: false
            }));
        }
        
        // Set dueDate to one week from now if not provided
        if (!dueDate) {
            const now = new Date();
            dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        }

        const newGoal = ({
            title,
            description,
            type,
            dueDate,
            rewards,
            tasks: processedTasks, // Include the processed tasks
            createdAt: new Date(),
            isCompleted: false,
            progress: 0,
            nbOfTasksCompleted: 0
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

            // Get the newly created goal with its generated _id
            const createdGoal = updatedUser.goals[updatedUser.goals.length - 1];
            
            res.status(201).json({ message: 'Goal created successfully', goal: createdGoal});
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

            // Get the newly created goal with its generated _id
            const createdGoal = updatedFamily.goals[updatedFamily.goals.length - 1];
            
            res.status(201).json({ message: 'Goal created successfully', goal: createdGoal});
        }
        
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

        if(userId && ['parent', 'admin'].includes(req.user.role)){
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


//API to update goal for personal goals
export const updateUserGoal = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || !['parent', 'admin'].includes(req.user.role)){
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
        return throwError({ message: "Error updating goal", res, status: 500 });
    }
};

//API to delete goal
export const deleteGoal = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || !['parent', 'admin'].includes(req.user.role)){
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
        return throwError({message: "Error deleting goal", res, status: 500});
    }
};

// API to create task for personal goals
export const createUserTask = async(req: Request, res: Response): Promise<void> => {
    try{
        const {userId, goalId, title, description, rewards} = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const goal = user.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});

        if (!title || !description) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const type = goal.type;

        const newTask = ({
            title,
            description,
            type,
            rewards : rewards || {stars: 2, coins: 1},
            createdAt: new Date()
        } as ITask);

        if (goal.isCompleted){
            goal.isCompleted = false;
            let stars = goal.rewards.stars;
            user.stars -= goal.rewards.stars;
            user.coins -= goal.rewards.coins;

            if (user.familyId) {
                await Family.findByIdAndUpdate(user.familyId, {
                    $inc: { totalStars: stars * -1}
                });
                await recalculateFamilyMemberRanks(user.familyId, user);
            }

        }
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

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin')){
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
        let starsTaskReward = task.rewards.stars;
        user.coins += task.rewards.coins;
        user.stars += starsTaskReward;
        user.nbOfTasksCompleted += 1;
        goal.nbOfTasksCompleted += 1;

        let starsGoalReward = 0;

        goal.progress = (goal.tasks.filter(task => task.isCompleted).length / goal.tasks.length) * 100;

        // Check if all tasks in the goal are completed
        if (goal.progress === 100) {
            goal.isCompleted = true;
            goal.completedAt =  new Date();

            starsGoalReward = goal.rewards.stars;

            // Reward user with coins and stars
            user.coins += goal.rewards.coins;
            user.stars += starsGoalReward;

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

        // Update the family total stars
        if (user.familyId) {
            const totalStars = starsTaskReward + starsGoalReward;
            await Family.findByIdAndUpdate(user.familyId, {
                $inc: { totalStars: totalStars, tasks: 1 },
            });
            await recalculateFamilyMemberRanks(user.familyId, user);
        }

        res.status(200).json({ message: "Task marked as done", task, goal });
    } catch (error) {
        return throwError({ message: "Error marking task as done", res, status: 500 });
    }
};

//API to get monthly stats for goals and tasks for user

export const getMonthlyStats = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        const {userId} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const targetUserId = userId || req.user._id;

        if (!checkId({ id: targetUserId, res })) return;

        const isAuthorized = req.user._id.toString() === targetUserId.toString() || ['parent', 'admin'].includes(req.user.role);
        if (!isAuthorized) {
            return throwError({ message: "Forbidden", res, status: 403 });
        }

        
        // Get the start and end dates of the current month
        const startOfCurrentMonth = startOfMonth(new Date());
        const endOfCurrentMonth = endOfMonth(new Date());

        // Retrieve the user and filter tasks/goals for the current month
        const user = await User.findById(targetUserId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const tasksForCurrentMonth = user.goals.flatMap(goal =>
            goal.tasks.filter(task =>
                task.createdAt &&
                task.createdAt >= startOfCurrentMonth &&
                task.createdAt <= endOfCurrentMonth
            )
        );

        const completedTasksForCurrentMonth = tasksForCurrentMonth.filter(task => task.isCompleted);

        const goalsForCurrentMonth = user.goals.filter(goal =>
            goal.createdAt >= startOfCurrentMonth && goal.createdAt <= endOfCurrentMonth
        );

        const completedGoalsForCurrentMonth = goalsForCurrentMonth.filter(goal => goal.isCompleted);

        // Return stats
        res.status(200).json({
            totalTasks: tasksForCurrentMonth.length,
            completedTasks: completedTasksForCurrentMonth.length,
            totalGoals: goalsForCurrentMonth.length,
            completedGoals: completedGoalsForCurrentMonth.length,
        });
    } catch (error) {
        return throwError({ message: "Error retrieving monthly stats", res, status: 500 });
    }
};
