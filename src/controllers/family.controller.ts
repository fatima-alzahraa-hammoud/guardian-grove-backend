import { Request, Response } from "express";
import { Family } from "../models/family.model";
import { throwError } from "../utils/error";
import { User } from "../models/user.model";
import { checkId } from "../utils/checkId";
import { CustomRequest } from "../interfaces/customRequest";
import { Achievement } from "../models/achievements.model";
import { ITask } from "../interfaces/ITask";
import { getTimePeriod } from "../utils/getTimePeriod";
import { sanitizePublicId } from "../utils/sanitizePublicId";
import path from "path";
import { v2 as cloudinary } from 'cloudinary';
import { deleteFromCloudinary, extractPublicIdFromUrl, uploadFamilyAvatar } from "../utils/cloudinary";

//API get all families (Fixed for admin access)
export const getAllFamilies = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        // Check if user is authenticated and is admin
        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        if (req.user.role !== 'admin') {
            return throwError({ message: "Forbidden - Admin access required", res, status: 403 });
        }

        console.log("Fetching families for admin:", req.user.email);

        const families = await Family.find()
            .populate({
                path: 'members',
                select: 'name email role stars'
            })
            .select('_id familyName email familyAvatar totalStars achievements members')
            .lean(); // Use lean() for better performance

        console.log("Found families:", families.length);

        if (!families || families.length === 0) {
            res.status(200).json({ 
                message: "No families found", 
                families: [] 
            });
            return;
        }

        // Transform the data to ensure all required fields are present
        const transformedFamilies = families.map(family => ({
            _id: family._id,
            familyName: family.familyName,
            email: family.email,
            familyAvatar: family.familyAvatar || null,
            totalStars: family.totalStars || 0,
            achievements: family.achievements || [],
            members: family.members || []
        }));

        console.log("Transformed families:", transformedFamilies.length);

        res.status(200).json({ 
            message: "Retrieving all families successfully", 
            families: transformedFamilies 
        });
    } catch (error) {
        console.error("Error in getAllFamilies:", error);
        return throwError({ message: "Failed to retrieve all families.", res, status: 500 });
    }
};

// Get Family by ID
export const getFamily = async (req: Request, res: Response): Promise<void> => {
    try {
        const { familyId } = req.body;
        if(!checkId({id: familyId, res})) return;

        const family = await Family.findById(familyId)
            .select('_id familyName email familyAvatar totalStars tasks gender')
            .populate({
                path: 'members',
                select: 'name email role avatar stars coins gender'
            });

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

        if (!familyId) {
            return throwError({ message: "Family ID is required", res, status: 400 });
        }

        if (!checkId({ id: familyId, res })) return;
        
        console.log("Fetching family members for family:", familyId);

        const family = await Family.findById(familyId).populate({
            path: 'members',
            select: 'name email birthday role avatar gender stars coins interests nbOfTasksCompleted rankInFamily memberSince'
        });

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        console.log("Found family:", family.familyName, "with", family.members?.length || 0, "members");

        if (!family.members || family.members.length === 0) {
            res.status(200).json({ 
                message: "No family members found", 
                familyWithMembers: {
                    ...family.toObject(),
                    members: []
                }
            });
            return;
        }

        res.status(200).json({ 
            message: "Retrieving family members successfully", 
            familyWithMembers: family
        });

    } catch (error) {
        console.error("Error in getFamilyMembers:", error);
        return throwError({ message: "Failed to retrieve family members.", res, status: 500 });
    }
};

// Update Family Details
export const updateFamily = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        if(!req.user || !['parent', 'admin'].includes(req.user.role)){
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const { familyId, familyName, email, familyAvatarPath } = req.body;

        const targetFamilyId = familyId || req.user.familyId;

        if (!targetFamilyId) {
            return throwError({ message: "Family ID not found", res, status: 400 });
        }

        if(!checkId({id: targetFamilyId, res})) return;

        const family = await Family.findById(targetFamilyId);

        if (!family) {
            return throwError({ message: "Family not found.", res, status: 404 });
        }

        if(req.user.email !== family.email && req.user.role !== "admin"){
            return throwError({ message: "Forbidden", res, status: 403 });
        }

        const originalEmail = family.email;

        // Check if a family with the same email exists (excluding current family)
        if (email && email !== family.email) {
            const existingFamilyWithEmail = await Family.findOne({ email, _id: { $ne: family._id } });
            if (existingFamilyWithEmail) {
                return throwError({ message: "A family with the same email already exists.", res, status: 400 });
            }
        }

        // Check if a family with the same name exists (excluding current family)
        if (familyName && familyName !== family.familyName) {
            const existingFamilyWithName = await Family.findOne({ familyName, _id: { $ne: family._id } });
            if (existingFamilyWithName) {
                return throwError({ message: "A family with the same name already exists.", res, status: 400 });
            }
        }

        // Handle family avatar update
        let familyAvatarUrl = family.familyAvatar;
        const oldFamilyAvatarUrl = family.familyAvatar;
        
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const familyAvatarImage = files?.familyAvatar?.[0];

        console.log("Family avatar image:", familyAvatarImage);
        console.log("Family avatar path:", familyAvatarPath);

        // Check if there's a new file upload
        if (familyAvatarImage) {
            try {
                // Upload new family avatar to Cloudinary using utility function
                const familyAvatarResult = await uploadFamilyAvatar(familyAvatarImage.buffer, familyAvatarImage.originalname);
                familyAvatarUrl = familyAvatarResult.secure_url;

                // Delete old family avatar from Cloudinary if it exists and is not a predefined avatar
                if (oldFamilyAvatarUrl && !oldFamilyAvatarUrl.startsWith('/assets/')) {
                    const oldPublicId = extractPublicIdFromUrl(oldFamilyAvatarUrl);
                    if (oldPublicId) {
                        try {
                            await deleteFromCloudinary(oldPublicId);
                        } catch (deleteError) {
                            console.warn('Failed to delete old family avatar:', deleteError);
                            // Continue execution even if deletion fails
                        }
                    }
                }
            } catch (uploadError) {
                console.error('Family avatar upload error:', uploadError);
                return throwError({ message: "Failed to upload family avatar image.", res, status: 500 });
            }
        } 
        // Check if there's a predefined avatar path in the request body
        else if (familyAvatarPath && familyAvatarPath !== family.familyAvatar) {
            // Only accept predefined avatars with /assets/images/avatars/ path
            if (familyAvatarPath.startsWith('/assets/images/avatars/')) {
                familyAvatarUrl = familyAvatarPath; // Store the full path
                
                // Delete old Cloudinary family avatar if switching to predefined avatar
                if (oldFamilyAvatarUrl && !oldFamilyAvatarUrl.startsWith('/assets/')) {
                    const oldPublicId = extractPublicIdFromUrl(oldFamilyAvatarUrl);
                    if (oldPublicId) {
                        try {
                            await deleteFromCloudinary(oldPublicId);
                        } catch (deleteError) {
                            console.warn('Failed to delete old family avatar:', deleteError);
                            // Continue execution even if deletion fails
                        }
                    }
                }
            } else {
                return throwError({ message: "Invalid avatar path. Only predefined avatars are allowed.", res, status: 400 });
            }
        }

        // Update family fields
        if (familyName) family.familyName = familyName;
        if (email) family.email = email;
        
        // Update avatar if there was a change (either file upload or path change)
        if (familyAvatarImage || (familyAvatarPath && familyAvatarPath !== family.familyAvatar && familyAvatarPath.startsWith('/assets/images/avatars/'))) {
            family.familyAvatar = familyAvatarUrl;
        }

        // Update all family members' email if family email changed
        if (email && email !== originalEmail) {
            try {
                const updateResult = await User.updateMany(
                    { familyId: targetFamilyId }, 
                    { $set: { email: email } }
                );
                console.log(`Updated ${updateResult.modifiedCount} family members' emails`);
            } catch (updateError) {
                console.error('Failed to update family members emails:', updateError);
                // Don't fail the whole operation, just log the error
            }
        }

        await family.save();

        res.status(200).send({ message: "Family updated successfully.", family: family });
    } catch (error) {
        console.error('Update family error:', error);
        return throwError({ message: "Failed to update family.", res, status: 500 });
    }
};


//API to delete family
export const deleteFamily = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        // Check for authorized user roles
        if (!req.user || !['parent', 'admin'].includes(req.user.role)) {
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

        if (req.user.email !== family.email && req.user.role !== "admin") {
            return throwError({ message: "Forbidden", res, status: 401 });
        }

        // Delete family avatar from Cloudinary if it's not a predefined avatar
        if (family.familyAvatar && !family.familyAvatar.startsWith('/assets/')) {
            const publicId = extractPublicIdFromUrl(family.familyAvatar);
            if (publicId) {
                try {
                    await deleteFromCloudinary(publicId);
                    console.log('Family avatar deleted from Cloudinary:', publicId);
                } catch (deleteError) {
                    console.warn('Failed to delete family avatar from Cloudinary:', deleteError);
                    // Continue with family deletion even if avatar deletion fails
                }
            }
        }

        // Get all users to delete their avatars from Cloudinary
        const familyMembers = await User.find({ familyId }).select('avatar');
        
        // Delete user avatars from Cloudinary
        for (const member of familyMembers) {
            if (member.avatar && !member.avatar.startsWith('/assets/')) {
                const publicId = extractPublicIdFromUrl(member.avatar);
                if (publicId) {
                    try {
                        await deleteFromCloudinary(publicId);
                        console.log(`User avatar deleted from Cloudinary for user ${member._id}:`, publicId);
                    } catch (deleteError) {
                        console.warn(`Failed to delete user avatar from Cloudinary for user ${member._id}:`, deleteError);
                        // Continue with deletion even if individual avatar deletion fails
                    }
                }
            }
        }

        // Delete all users associated with the family
        await User.deleteMany({ familyId });

        // Delete the family
        await Family.findByIdAndDelete(familyId);

        res.status(200).send({ message: "Family and all associated members deleted successfully." });
    } catch (error) {
        console.error('Delete family error:', error);
        return throwError({ message: "Failed to delete family.", res, status: 500 });
    }
};

//API to update goal of a family
export const updateFamilyGoal = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        if(!req.user || !['parent', 'admin'].includes(req.user.role)){
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
            createdAt: new Date()
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

        if(!req.user || (req.user.role !== 'parent' && req.user.role !== 'admin')){
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

        const family = await Family.findById(familyId).populate({
            path: 'members',
            select: 'stars coins nbOfTasksCompleted'
        }); 
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
            totalStars += task.rewards.stars;
            member.coins += task.rewards.coins;
            member.stars += task.rewards.stars;
            member.nbOfTasksCompleted += 1;
            await member.save();
        }

        goal.progress = (goal.tasks.filter(task => task.isCompleted).length / goal.tasks.length) * 100;

        // Check if all tasks in the goal are completed
        const allTasksCompleted = goal.tasks.every(task => task.isCompleted);
        if (allTasksCompleted) {
            goal.isCompleted = true;

            // Reward user with coins and stars
            for (const member of family.members) {
                totalStars += goal.rewards.stars;
                member.coins += goal.rewards.coins;
                member.stars += goal.rewards.stars;
                await member.save();
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
        return throwError({ message: "Error marking task as done", res, status: 500 });
    }
};

//API to get leaderboard
export const getLeaderboard = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { familyId } = req.query;
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
                .select(`${stars} ${tasks} familyName familyAvatar`)
                .sort({ [stars]: -1, [tasks]: -1 })
                .exec();

            if (!families || families.length === 0) {
                results[`${period}Top10`] = [];
                results[`${period}FamilyRank`] = null;
                continue;
            }

            // Calculate leaderboard and ranks
            let rank = 0;
            let previousStars = 0;
            let previousTasks = 0;

            const leaderboard = families.map((family, index) => {
                const familyStars = family.get(stars) || 0;
                const familyTasks = family.get(tasks) || 0;

                // Update rank only when stars/tasks change
                if (familyStars !== previousStars || familyTasks !== previousTasks) {
                    rank++;
                    previousStars = familyStars;
                    previousTasks = familyTasks;
                }

                return {
                    familyName: family.familyName,
                    familyAvatar: family.familyAvatar,
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

            const top10 = leaderboard.filter(entry => entry.rank <= 10);
            results[`${period}Top10`] = top10;

            // Find the rank of the specific family for the period
            if (familyId){
                results[`${period}FamilyRank`] = familyId
                ? leaderboard.find((family) => family.familyId === familyId) || null
                : null;
            }   
        }

        res.status(200).json({ message: 'Leaderboard fetched successfully', ...results, });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard', error });
    }
};

export const getFamilyLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {

        const { familyId } = req.body;

        if (!checkId({ id: familyId, res })) return;

        const family = await Family.findById(familyId).populate({
            path: 'members',
            select: 'name avatar stars nbOfTasksCompleted',
            options: { sort: { stars: -1, nbOfTasksCompleted: -1 } }
        });        
        
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        if (!family.members || family.members.length === 0) {
            return throwError({ message: "Members not found", res, status: 404 });
        }

        let rank = 1;
        let previousStars = 0;
        let previousTasks = 0;
        const leaderboard = family.members.map((member, index) => {
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

        const family = await Family.findById(req.user.familyId).populate({
            path: 'members',
            select: '_id stars'
        });        
        
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

        const family = await Family.findById(req.user.familyId).populate({
            path: 'members',
            select: '_id' // Only select _id since we just need the count
        });        
        
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

//API to get famly progress stats for goals, tasks, and achievements

export const getFamilyProgressStats = async (req: CustomRequest, res: Response): Promise<void> => {
    try {

        const {familyId, timeFrame} = req.body;

        if (!req.user) {
            return throwError({ message: "Unauthorized", res, status: 401 });
        }

        const targetFamilyId = familyId || req.user.familyId;

        if (!checkId({ id: targetFamilyId, res })) return;

        const family = await Family.findById(targetFamilyId);
        if (!family) {
            return throwError({ message: "Family not found", res, status: 404 });
        }

        // Get the date range for the selected time frame
        const { start, end } = getTimePeriod(timeFrame);

        const tasksForCurrentPeriod = family.goals.flatMap(goal =>
            goal.tasks.filter(task =>
                task.createdAt &&
                task.createdAt >= start &&
                task.createdAt <= end
            )
        );

        const completedTasksForCurrentPeriod = tasksForCurrentPeriod.filter(task => task.isCompleted);

        const goalsForCurrentPeriod = family.goals.filter(goal =>
            goal.createdAt >= start && goal.createdAt <= end
        );

        const completedGoalsForCurrentPeriod = goalsForCurrentPeriod.filter(goal => goal.isCompleted);

        const totalAchievements = await Achievement.countDocuments();

        const unlockedAchievements = family.achievements.length;
        
        // Return stats
        res.status(200).json({
            totalTasks: tasksForCurrentPeriod.length,
            completedTasks: completedTasksForCurrentPeriod.length,
            totalGoals: goalsForCurrentPeriod.length,
            completedGoals: completedGoalsForCurrentPeriod.length,
            totalAchievements: totalAchievements,
            unlockedAchievements: unlockedAchievements
        });

    } catch (error) {
        return throwError({ message: "Error retrieving monthly stats", res, status: 500 });
    }
};
