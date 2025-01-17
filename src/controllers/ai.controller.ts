import { Request, Response } from "express";
import { getCompletedTasks } from "../utils/AIHelperMethods/getCompletedTasks";
import { getLastChatMessages, getLastFourChats } from "../utils/AIHelperMethods/getLastChatMessages";
import { generateGoalsAndTasks } from "../utils/AIHelperMethods/generateGoalsAndTasks";
import { User } from "../models/user.model";
import { openai } from "../index";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";
import { isToday } from "date-fns";

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

            Always generate organized and structured in a beautiful and friendly way. Bold the important ideas, and user break line!
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
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
            Generate a motivational daily message for the user${user}.
            generate it without word message, and without ay introduction, directly the message.
            Make it organized, beautiful and friendly and not more than two lines
        `
        const response = await openai.chat.completions.create({
            model: "gpt-4",
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

    nextRun.setHours(0, 8, 0, 0); 
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

export const generateLearningZone = async (req: Request, res: Response) => {
    try {
        const {userId} = req.body;
        if(!checkId({id: userId, res})) return;

        const user = await User.findById(userId);
        if (!user){
            return throwError({ message: "User not found", res, status: 404});
        }
        
        const aiPrompt = `
            Create a personalized learning zone for a ${user} aged ${user.birthday}. 
            The learning zone should include engaging, age-appropriate activities, tools, and resources that foster curiosity, creativity, and growth. 
            The learning zone should focus on [specific interests or subjects if available, e.g., science, art, or language learning]. 
            
            You can include the following details:

            - Recommended books, apps, or websites.
            - Creative activities or DIY projects.
            - Fun challenges or experiments.
            - A suggested daily or weekly schedule to maximize learning and engagement.
            - Tips to make learning enjoyable and interactive.
            - and others

            Please generate an well orgainzed friendly message
            Always generate organized and structured in a beautiful and friendly way. Bold the important ideas, and user break line!
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });

        const generatedLearningZone = response.choices[0].message.content;

        res.status(200).json({message: "Generate learning zone successfully", learningZone: generatedLearningZone});
    } catch (error) {
        console.error('Error generating learning zone:', error);
        throw new Error('Failed to generate learning zone');
    }
};  

export const generateTrackDay = async (req: Request, res: Response) => {
    try {
        const {userId} = req.body;

        const user = await User.findById(userId);
        if (!user){
            return throwError({ message: "User not found", res, status: 404});
        }
        const today = new Date();

        // Collect data for the track of the day
        const unlockedAchievements = user.achievements.filter(achievement =>
            isToday(new Date(achievement.unlockedAt)) // Filter achievements unlocked today
        ).map(achievement => achievement.achievementId.toString());

        const purchasedItems = user.purchasedItems.filter(item =>
            isToday(new Date(item.purchasedAt)) // Filter items purchased today
        ).map(item => item.itemId.toString());

        const completedGoals = user.goals.filter(goal =>
            goal.completedAt && isToday(new Date(goal.completedAt)) && goal.isCompleted // Filter goals completed today
        );

        const completedTasks = completedGoals.flatMap(goal =>
            goal.tasks.filter(task =>
                task.completedAt && isToday(new Date(task.completedAt)) && task.isCompleted // Filter tasks completed today
            )
        );

        const completedAdventures = user.adventures.filter(adventure =>
            adventure.isAdventureCompleted && adventure.challenges.some(challenge =>
                challenge.completedAt && isToday(new Date(challenge.completedAt)) // Filter adventures completed today
            )
        );

        const aiPrompt = `
            Generate a daily summary for the user with the following details:

            user: ${user}
            Unlocked Achievements: ${unlockedAchievements.join(", ")}
            Purchased Items: ${purchasedItems.join(", ")}
            Completed Goals: ${completedGoals.map(goal => goal.title).join(", ")}
            Completed Tasks: ${completedTasks.map(task => task.title).join(", ")}
            Completed Adventures: ${completedAdventures.map(adventure => adventure.adventureId.toString()).join(", ")}

            The summary should be motivational and encourage the user for their progress today and make it beautiful.
            Always generate organized and structured in a beautiful and friendly way, and generate it like statistics.
            Bold the important ideas, and user break line!
            use the user data. 
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });

        const dailySummary = response?.choices[0].message?.content;

        res.status(200).json({message: "Generate tack day successfully", dailySummary: dailySummary});

    } catch (error) {
        console.error("Error generating track of the day:", error);
    }
};

export const generateStory = async (req: Request, res: Response) => {
  try {

    const { userId } = req.body;

    // Fetch the user data
    const user = await User.findById(userId);
    if (!user) {
        return throwError({ message: "User not found", res, status: 404});
    }

    const age = new Date().getFullYear() - user.birthday.getFullYear();
    
    // Base AI prompt for the story
    let aiPrompt = `
        Tell an engaging, motivating, and creative story. Make the story interesting and suitable for the user's age, which is ${age} years old.
        Focus on making the narrative fun and inspiring while considering their maturity, preferences, and engagement level based on age.
        Write it in interactive, organized, structured way.
    `;

    // Call OpenAI to generate the story
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "system", content: aiPrompt }],
    });

    const story = response?.choices[0]?.message?.content;

    // Return the generated story to the client
    res.status(200).json({message: "Generate story successfully", story: story});

  } catch (error) {
    console.error("Error generating story:", error);
    res.status(500).json({ message: 'Error generating story' });
  }
}