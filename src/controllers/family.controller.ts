import { Request, Response } from "express";
import { Family } from "../models/family.model";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { CustomRequest } from "../interfaces/customRequest";
import { Achievement } from "../models/achievements.model";
import { ITask } from "../interfaces/ITask";

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

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin' && req.user.role !== 'owner')){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId, familyName, email } = req.body;
        if(!checkId({id: familyId, res})) return;

        
        const family = await Family.findById(familyId);

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        if(req.user.email !== family.email && req.user.role !== "admin"){
            return throwError({ message: "Forbidden", res, status: 401 });
        }

        family.familyName = familyName || family.familyName;
        family.email = email || family.email;

        if (email) {
            await User.updateMany(
                { familyId: familyId }, 
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
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'parent')) {
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
        const {familyId, goalId, title, description, type, rewards} = req.body;

        if(!checkId({id: goalId, res})) return;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        const goal = family.goals.find(goal => goal._id.toString() === goalId);
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
        await family.save();

        res.status(201).json({ message: 'Task created successfully', Task: newTask });
    }catch(error) {
        return throwError({ message: "An unknown error occurred while creating Task.", res, status: 500 });
    }
};


// API to update task
export const updateFamilyTask = async(req: Request, res: Response): Promise<void> => {
    try{
        const {familyId, taskId, goalId, title, description, type, rewards } = req.body;
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
        task.type = type || task.type;
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