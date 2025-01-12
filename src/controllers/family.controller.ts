import { Request, Response } from "express";
import { Family } from "../models/family.model";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { CustomRequest } from "../interfaces/customRequest";
import { Achievement } from "../models/achievements.model";
import { ITask } from "../interfaces/ITask";
import { recalculateFamilyMemberRanks } from "../utils/recalculateFamilyMemberRanks";

//API get all families
export const getAllFamilies = async (req: Request, res: Response): Promise<void> => {
    try {
        const families = await Family.find();
        
        if (!families || families.length === 0) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        res.status(200).send({ message:"Retrieving all families successfully", families });
    } catch (error) {
        return throwError({ message: "Failed to retrieve all families.", res, status: 500 });
    }
};

// Get Family by ID
export const getFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        const family = await Family.findById(familyId);
        
        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        res.status(200).send({ message:"Retrieving family successfully", family });
    } catch (error) {
        return throwError({ message: "Failed to retrieve family.", res, status: 500 });
    }
};

// Get family members of a family
export const getFamilyMembers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        
        // Find family and populate members with full user details
        const family = await Family.findById(familyId).populate({ path: "members._id", model: "User"}).lean();

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        // Flatten the structure to avoid `_id` nesting
        const familyWithMembers = {
            ...family,
            members: family.members.map(member => ({
                ...member._id,
                role: member.role
            }))
        };

        res.status(200).json({ message:"Retrieving family members successfully", familyWithMembers});

    } catch (error) {
        return throwError({ message: "Failed to retrieve family members.", res, status: 500 });
    }
};

// Update Family Details
export const updateFamily = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || !['parent', 'admin', 'owner'].includes(req.user.role)){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId, familyName, email, familyAvatar } = req.body;

        const targetFamilyId = familyId || req.user.familyId;

        if(!checkId({id: targetFamilyId, res})) return;

        
        const family = await Family.findById(targetFamilyId);

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        if(req.user.email !== family.email && req.user.role !== "admin"){
            return throwError({ message: "Forbidden", res, status: 401 });
        }

        // Check if a family with the same email or familyName exists
        if (email) {
            const existingFamilyWithEmail = await Family.findOne({ email, _id: { $ne: family._id } });
            if (existingFamilyWithEmail) {
                return throwError({ message: "A family with the same email already exists.", res, status: 400 });
            }
        }

        if (familyName) {
            const existingFamilyWithName = await Family.findOne({ familyName, _id: { $ne: family._id } });
            if (existingFamilyWithName) {
                return throwError({ message: "A family with the same name already exists.", res, status: 400 });
            }
        }


        family.familyName = familyName || family.familyName;
        family.email = email || family.email;
        family.familyAvatar = familyAvatar || family.familyAvatar;

        if (email) {
            await User.updateMany(
                { familyId: targetFamilyId }, 
                { $set: { email: email } }
            );
        }

        await family.save();

        res.status(200).send({ message: "Family updated successfully.", family: family });
    } catch (error) {
        return throwError({ message: "Failed to update family.", res, status: 500 });
    }
};

//API to delete family
export const deleteFamily = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        // Check for authorized user roles
        if (!req.user ||  !['parent', 'admin', 'owner'].includes(req.user.role)) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId } = req.body;

        // Check if familyId is valid
        if (!checkId({ id: familyId, res })) return;

        // Find the family to delete
        const family = await Family.findById(familyId);

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        if(req.user.email !== family.email && req.user.role !== "admin"){
            return throwError({ message: "Forbidden", res, status: 401 });
        }

        // Delete all users associated with the family
        await User.deleteMany({ familyId });

        // Delete the family
        await Family.findByIdAndDelete(familyId);

        res.status(200).send({ message: "Family and all associated members deleted successfully." });
    } catch (error) {
        return throwError({ message: "Failed to delete family.", res, status: 500 });
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

//API to get all goals for a specific family
export const getFamilyGoals = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        res.status(200).json({ message: 'Family goals retrieved', goals: family.goals });
    } catch (error) {
        return throwError({ message: "Error retrieving family goals", res, status: 500 });
    }
};

//API to delete a specific goal from the family
export const deleteFamilyGoal = async (req: Request, res: Response) => {
    try {
        const { familyId, goalId } = req.body;

        if(!checkId({id: familyId, res})) return;
        if(!checkId({id: goalId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const goalIndex = family.goals.findIndex(goal => goal._id.toString() === goalId);
        if (goalIndex === -1) {
            return throwError({ message: "Goal not found", res, status: 404 });
        }

        family.goals.splice(goalIndex, 1);
        await family.save();

        res.status(200).json({ message: 'Goal deleted successfully', family });
    } catch (error) {
        return throwError({ message: "Error deleting family goal", res, status: 500 });
    }
};

// API to create task for family goals
export const createFamilyTasks = async(req: Request, res: Response): Promise<void> => {
    try{
        const {familyId, goalId, title, description, rewards} = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});

        if (!title || !description) {
            return throwError({ message: "All required fields must be filled.", res, status: 400});
        }

        const newTask = ({
            title,
            description,
            type: 'family',
            rewards : rewards || {stars: 2, coins: 1},
        } as ITask);

        goal.tasks.push(newTask);
        await family.save();

        res.status(201).json({ message: 'Task created successfully', Task: newTask });
    }catch(error) {
        return throwError({ message: "An unknown error occurred while creating Task.", res, status: 500 });
    }
};


// API to update task
export const updateFamilyTask = async(req: Request, res: Response): Promise<void> => {
    try{
        const {familyId, taskId, goalId, title, description, rewards } = req.body;
        if(!checkId({id: taskId, res})) return;
        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});
    
        const task = goal.tasks.find(task => task._id.toString() === taskId);
        if (!task) {
            return throwError({ message: "Task not found", res, status: 404 });
        }


        task.title = title || task.title;
        task.description = description || task.description;
        if (rewards) {
            task.rewards.stars = rewards.stars || task.rewards.stars;
            task.rewards.coins = rewards.coins || task.rewards.coins;
        }

        await family.save();

        res.status(200).json({ message: "Task updated successfully", task });

    }catch(error){
        return throwError({ message: "An unknown error occurred while update task.", res, status: 500 });
    }
};


//API to delete task
export const deleteFamilyTask = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId, goalId, taskId } = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: familyId, res})) return;
        if(!checkId({id: taskId, res})) return;


        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
        if (!goal) 
            return throwError({ message: "Goal not found", res, status: 404});


        const taskIndex = goal.tasks.findIndex(
            (task) => task._id.toString() === taskId
        );        
        if (taskIndex === -1) {
            return throwError({ message: "Task not found", res, status: 404 });
        }

        const [deletedTask] = goal.tasks.splice(taskIndex, 1);

        await family.save();

        res.status(200).json({ message: 'Task deleted successfully', DeletedTask: deletedTask });
    } catch (error) {
        console.error(error);
        return throwError({message: "Error deleting task", res, status: 500});
    }
};


//API to get family task by id
export const getFamilyTaskById = async(req: Request, res: Response): Promise<void> => {
    try{
        const {familyId, taskId, goalId } = req.body;
        if(!checkId({id: taskId, res})) return;
        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "family not found", res, status: 404 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
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

//API to complete family task
export const completeFamilyTask = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { familyId, goalId, taskId } = req.body;

        if (!checkId({ id: familyId, res }) || !checkId({ id: goalId, res }) || !checkId({ id: taskId, res })) {
            return;
        }

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
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
        
        let totalStars = 0;
        for (const member of family.members) {
            const user = await User.findById(member._id);
            if (user) {
                totalStars += task.rewards.stars;
                user.coins += task.rewards.coins;
                user.stars += task.rewards.stars;
                user.nbOfTasksCompleted += 1;
                await user.save();
            }
        }

        goal.progress = (goal.tasks.filter(task => task.isCompleted).length / goal.tasks.length) * 100;

        // Check if all tasks in the goal are completed
        const allTasksCompleted = goal.tasks.every(task => task.isCompleted);
        if (allTasksCompleted) {
            goal.isCompleted = true;

            // Reward user with coins and stars
            for (const member of family.members) {
                const user = await User.findById(member._id);
                if (user) {
                    totalStars += goal.rewards.stars
                    user.coins += goal.rewards.coins;
                    user.stars += goal.rewards.stars;
                    await user.save();
                }
            }

            // Unlock Achievement if available
            if (goal.rewards.achievementId) {
                const achievement = await Achievement.findById(goal.rewards.achievementId);
                if (!achievement) {
                    return throwError({ message: "Achievement not found", res, status: 404 });
                }
                family.achievements.push({achievementId: achievement._id, unlockedAt: new Date(),});

                res.status(200).json({ message: "Achievement unlocked successfully", achievement });
            }
        }

        family.totalStars += totalStars;
        family.stars.daily += totalStars;
        family.stars.weekly += totalStars;
        family.stars.monthly += totalStars;
        family.stars.yearly += totalStars;
        family.tasks += 1;
        family.taskCounts.daily += 1;
        family.taskCounts.weekly += 1;
        family.taskCounts.monthly += 1;
        family.taskCounts.yearly += 1;

        await family.save();

        res.status(200).json({ message: "Task marked as done", task, goal });
    } catch (error) {
        console.error(error);
        return throwError({ message: "Error marking task as done", res, status: 500 });
    }
};

//API to get leaderboard
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;

        const periods = {
            daily: { stars: 'stars.daily', tasks: 'taskCounts.daily' },
            weekly: { stars: 'stars.weekly', tasks: 'taskCounts.weekly' },
            monthly: { stars: 'stars.monthly', tasks: 'taskCounts.monthly' },
            yearly: { stars: 'stars.yearly', tasks: 'taskCounts.yearly' },
        };

        const results: any = {}; // Object to store top10 and familyRank for each period

        // Iterate through each period
        for (const [period, fields] of Object.entries(periods)) {
            const { stars, tasks } = fields;

            const families = await Family.find()
                .select(`${stars} ${tasks} familyName`)
                .sort({ [stars]: -1, [tasks]: -1 })
                .exec();

            if (!families || families.length === 0) {
                results[`${period}Top10`] = [];
                results[`${period}FamilyRank`] = null;
                continue;
            }

            // Calculate leaderboard and ranks
            let rank = 0;
            let i = 0;
            let previousStars = 0;
            let previousTasks = 0;

            const leaderboard = families.map((family, index) => {
                const familyStars = family.get(stars) || 0;
                const familyTasks = family.get(tasks) || 0;

                // Update rank only when stars/tasks change
                if (familyStars !== previousStars || familyTasks !== previousTasks) {
                    rank = ++i;
                    previousStars = familyStars;
                    previousTasks = familyTasks;
                }

                return {
                    familyName: family.familyName,
                    stars: familyStars,
                    tasks: familyTasks,
                    rank,
                    familyId: family._id.toString(),
                };
            });

            if(!leaderboard){
                res.status(200).send({message: "no leaderboard"});
                return;
            }

            // Extract top 10 for the period
            results[`${period}Top10`] = leaderboard.slice(0, 10);

            // Find the rank of the specific family for the period
            if (familyId){
                results[`${period}FamilyRank`] = familyId
                ? leaderboard.find((family) => family.familyId === familyId) || null
                : null;
            }   
        }

        // Respond with aggregated results
        res.status(200).json({
            message: 'Leaderboard fetched successfully',
            ...results,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard', error });
    }
};

export const getFamilyLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {

        const { familyId } = req.body;

        if (!checkId({ id: familyId, res })) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const members = await User.find({ familyId }).select("stars nbOfTasksCompleted").sort({ totalStars: -1, tasks: -1 }).exec();
        if (!members) {
            return throwError({ message: "Members not found", res, status: 404 });
        }

        let rank = 1;
        let previousStars = 0;
        let previousTasks = 0;
        const leaderboard = members.map((member, index) => {
            if (previousStars !== member.stars || previousTasks !== member.nbOfTasksCompleted) {
                rank = index + 1;
            }
            previousStars = member.stars;
            previousTasks = member.nbOfTasksCompleted;
            return { ...member.toObject(), rank };
        });

        res.status(200).send({
            message: 'Leaderboard fetched successfully',
            familyLeaderboard: leaderboard,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
};

// API to update stars for all family members and recalculate total stars
export const updateAllFamilyMembersStars = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !req.user.familyId) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { stars } = req.body;  // Stars to add to each member
        if (!Number.isInteger(stars)) {
            return throwError({ message: "Invalid stars value", res, status: 400 });
        }

        const family = await Family.findById(req.user.familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        // Update stars for all family members
        const membersIds = family.members.map((member) => member._id);
        await User.updateMany(
            { _id: { $in: membersIds } },
            { $inc: { stars } }
        );

        // Recalculate total stars for family
        const totalStars = await User.aggregate([
            { $match: { _id: { $in: membersIds } } },
            { $group: { _id: null, totalStars: { $sum: "$stars" } } }
        ]);

        // Update the family document
        family.totalStars = totalStars[0]?.totalStars || 0;
        await family.save();

        res.status(200).json({
            message: "All family members' stars updated successfully",
            totalStars: family.totalStars,
        });
    } catch (error) {
        return throwError({ message: "Error updating family members' stars", res, status: 500 });
    }
};

//API to get family name and number of members
export const getFamilyNameNbMembersStars = async (req: CustomRequest, res: Response): Promise<void> => {
    try{

        if (!req.user || !req.user.familyId) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const family = await Family.findById(req.user.familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        res.status(200).json({
            message: "Retrieving family name and number of members successfully",
            familyName: family.familyName,
            numberOfMembers: family.members.length,
            stars: family.totalStars,
        });
    }catch(error){
        return throwError({ message: "Error retrieving family name and number of members", res, status: 500 });
    }
}