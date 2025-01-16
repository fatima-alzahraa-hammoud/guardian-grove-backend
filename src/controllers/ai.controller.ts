import { Request, Response } from "express";
import { getCompletedTasks } from "../utils/AIHelperMethods.ts/getCompletedTasks";
import { getLastChatMessages, getLastFourChats } from "../utils/AIHelperMethods.ts/getLastChatMessages";
import { generateGoalsAndTasks } from "../utils/AIHelperMethods.ts/generateGoalsAndTasks";
import { User } from "../models/user.model";
import { openai } from "../index";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";

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

export const generateGrowthPlans = async (req: Request, res: Response) => {
    try {
        const {userId} = req.body;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user){
            return throwError({ message: "User not found", res, status: 404});
        }
        
        const aiPrompt = `
            You are an AI assistant that helps generate personalized growth plans based on user details. The growth plan should focus on the following aspects:
            - Personal development
            - Learning goals in specific areas
            - A well-balanced mix of fun, physical activity, and mental tasks

            every time you asked to generate growth plans change the response
            The user details are as follows:
            - Name: ${user.name}
            - Birthday: ${user.birthday}
            - Interests: ${user.interests.join(", ")}
            - Goals: ${user.goals}

            Generate a growth plan that includes:
            1. Short-term and long-term goals
            2. Specific tasks for each goal
            3. Fun and engaging activities related to the user’s interests
            4. Tips for improvement and overcoming challenges
            5. Motivational suggestions for staying on track
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: aiPrompt }],
        });

        const generatedPlan = response.choices[0].message.content;

        res.status(200).json({message: "Generate growth plan successfully", plan: generatedPlan});
    } catch (error) {
        console.error('Error generating growth plan:', error);
        throw new Error('Failed to generate growth plan');
    }
};  

export const generateDailyMessage = async(userId: string) => {
    try {
        const user = await User.findById(userId);
        if (!user){
            return "User not found";
        }

        const aiPrompt = `
            Generate a motivational daily message for the user ${user}.
        `
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: aiPrompt }],
        });

        const dailyMessage = response?.choices[0].message?.content;

        user.dailyMessage = dailyMessage || "You are shining 💫";

        await user.save();
    } catch (error) {
        console.log("Something went error", error);
    }
}

// Function to calculate the time until 10:30 AM tomorrow
const getTimeUntilNextRun = () => {
    const now = new Date();
    const nextRun = new Date();

    nextRun.setHours(11, 5, 0, 0); 
    if (now > nextRun) {
        nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.getTime() - now.getTime(); 
};

// Function to start the interval and timeout for daily messages for all users
const startDailyMessageSchedule = async () => {
    const users = await User.find();
    if (users.length === 0) {
        console.log("No users found.");
        return;
    }

    const timeUntilNextRun = getTimeUntilNextRun();

    setTimeout(() => {
        users.forEach(user => {
            generateDailyMessage(user._id.toString());
        });

        setInterval(() => {
            users.forEach(user => {
                generateDailyMessage(user._id.toString());
            });
        }, 24 * 60 * 60 * 1000); 
    }, timeUntilNextRun); 
};

startDailyMessageSchedule();