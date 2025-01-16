import { Request, Response } from "express";
import { getCompletedTasks } from "../utils/AIHelperMethods.ts/getCompletedTasks";
import { getLastChatMessages } from "../utils/AIHelperMethods.ts/getLastChatMessages";
import { generateGoalsAndTasks } from "../utils/AIHelperMethods.ts/generateGoalsAndTasks";
import { User } from "../models/user.model";

export const regenerateGoalsAndTasks = async (userId: string) => {
    try {

        // Step 1: Get the last 3 chats and the last 6 messages of each chat
        const lastChats = await getLastChatMessages(userId);
    
        // Step 2: Get the tasks completed by the user
        const completedTasks = await getCompletedTasks(userId);
    
        // Step 3: Get the user's interests
        const user = await User.findById(userId);
        const interests = user?.interests || [];

        // Step 4: Regenerate new goals based on the data
        const regeneratedGoals = await generateGoalsAndTasks(userId, lastChats, completedTasks, interests);
        
        return regeneratedGoals;
    } catch (error) {
      console.error('Error generating and saving goals and tasks:', error);
    }
};

export const regenerateGoalsAndTasksRoute = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ message: "User ID is required." });
            return;
        }

        const generatedTasksAndGoals =  await regenerateGoalsAndTasks(userId);

        res.status(200).json({ message: "Goals and tasks regenerated successfully.", goal: generatedTasksAndGoals });
    } catch (error) {
        console.error("Error in regenerateGoalsAndTasksRoute:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
