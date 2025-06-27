import { Request, Response } from "express";
import { getCompletedTasks } from "../utils/AIHelperMethods/getCompletedTasks";
import { getLastChatMessages, getLastFourChats } from "../utils/AIHelperMethods/getLastChatMessages";
import { generateGoalsAndTasks } from "../utils/AIHelperMethods/generateGoalsAndTasks";
import { User } from "../models/user.model";
import { openai } from "../index";
import { checkId } from "../utils/checkId";
import { throwError } from "../utils/error";
import { isToday } from "date-fns";
import { INotification } from "../interfaces/INotification";
import { Adventure } from "../models/adventure.model";

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
            model: "deepseek-chat",
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
            model: "deepseek-chat",
            messages: [{ role: "system", content: aiPrompt }],
        });

        const dailyMessage = response?.choices[0].message?.content;

        user.dailyMessage = dailyMessage || "You are shining 💫";

        await user.save();
    } catch (error) {
        console.log("Something went error", error);
    }
}

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
            model: "deepseek-chat",
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
            model: "deepseek-chat",
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
        model: "deepseek-chat",
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

export const generateViewTasks = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!checkId({ id: userId, res })) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const completedTasks = user.goals.flatMap(goal =>
            goal.tasks.filter(task => task.isCompleted).map(task => task.title)
        );

        const incompleteTasks = user.goals.flatMap(goal =>
            goal.tasks.filter(task => !task.isCompleted).map(task => task.title)
        );

        const aiPrompt = `
            You are an AI assistant that generates personalized task suggestions for users based on their progress and interests.
            
            User Details:
            - Name: ${user.name}
            - Interests: ${user.interests.join(", ")}
            - Completed Tasks: ${completedTasks.join(", ")}
            - Incomplete Tasks: ${incompleteTasks.join(", ")}
            
            Generate a structured and motivational list of tasks for the user:
            1. Suggest tasks aligned with their interests.
            2. Include fun and engaging tasks to keep the user motivated.
            3. Recommend strategies to complete incomplete tasks.
            4. Provide tips for organizing their time effectively.
            5. Ensure the tone is friendly and encouraging, and format the response beautifully with key points bolded and well-organized sections.

            please always be creative in your answers and structure the text in a creative way.
        `;

        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 300
        });

        let generatedViewTasks = response?.choices[0]?.message?.content;
        
        res.status(200).json({
            message: "View tasks generated successfully",
            viewTasks: generatedViewTasks,
        });
    } catch (error) {
        console.error("Error generating view tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const generateQuickTips = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!checkId({ id: userId, res })) return;

        const user = await User.findById(userId);
        if (!user) {
            return throwError({ message: "User not found", res, status: 404 });
        }

        const age = new Date().getFullYear() - user.birthday.getFullYear();

        const aiPrompt = `
            Generate creative and age-appropriate tips for someone who is ${age} years old.
            Generate a structured and motivational quick tip for the user.
            Ensure the tone is friendly and encouraging.
            Please always be creative in your answers and structure the text in a creative way.

            The tip should include:
            - title: A concise, small, and creative name for the tip. 
            - message: A small tip content, brief, be general and creative, I need it small.

            Example of structure: 
            Tip {
                title: "Stay Active",
                message: "Even a 10-minute walk can boost your energy and mood!"
            }
            IMPORTANT: Return ONLY a valid JSON object.
        `;

        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 1,
            max_tokens: 100,
        });

        let generatedQuickTip = response?.choices[0]?.message?.content;

        if (!generatedQuickTip) {
            return throwError({ message: "Failed to generate quick tip", res, status: 500 });
        }

        let title: string = "Default Title";
        let message: string = "Default Message";

        try {
            // Strategy 1: Try to parse as JSON directly
            let cleanedText = generatedQuickTip.trim();
            
            // Remove markdown code blocks if present
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsedTip = JSON.parse(cleanedText);
            title = parsedTip.title;
            message = parsedTip.message;

        } catch (jsonError) {
            console.log("JSON parsing failed, trying regex patterns...");
            
            // Strategy 2: Multiple regex patterns
            const patterns = [
                // Original pattern
                /Tip\s*\{\s*title:\s*"([^"]+)",\s*message:\s*"([^"]+)"\s*\}/,
                // Without "Tip" prefix
                /\{\s*title:\s*"([^"]+)",\s*message:\s*"([^"]+)"\s*\}/,
                // With single quotes
                /\{\s*title:\s*'([^']+)',\s*message:\s*'([^']+)'\s*\}/,
                // JSON-like with "title" and "message" keys
                /"title":\s*"([^"]+)",\s*"message":\s*"([^"]+)"/,
                // More flexible spacing
                /title:\s*"([^"]+)"[\s\S]*?message:\s*"([^"]+)"/i,
            ];

            let matched = false;
            for (const pattern of patterns) {
                const match = generatedQuickTip.match(pattern);
                if (match) {
                    title = match[1];
                    message = match[2];
                    matched = true;
                    console.log("Matched with pattern:", pattern);
                    break;
                }
            }

            if (!matched) {
                console.error("All parsing strategies failed. Response:", generatedQuickTip);
                
                // Strategy 3: Fallback - extract any quoted strings
                const quotes = generatedQuickTip.match(/"([^"]+)"/g);
                if (quotes && quotes.length >= 2) {
                    title = quotes[0].replace(/"/g, '');
                    message = quotes[1].replace(/"/g, '');
                } else {
                    // Last resort - generate a default tip
                    title = "Daily Motivation";
                    message = "Every step forward is progress, no matter how small!";
                }
            }
        }

        // Validate extracted data
        if (!title || !message) {
            title = "Stay Positive";
            message = "Believe in yourself and keep moving forward!";
        }

        // Create a notification for the tip
        const newNotification = ({
            title,
            message: message,
            category: "tip",
            type: "personal",
            timestamp: new Date(),
            isRead: false,
            isReadBy: [],
        } as unknown as INotification);

        user.notifications.push(newNotification); 
        await user.save();

        res.status(200).json({
            message: "Quick tip generated and notification created successfully",
            quickTip: { title, message },
            notification: newNotification,
        });

    } catch (error) {
        console.error("Error generating tip:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// API to generate a question to test task completion
export const generateTaskCompletionQuestion = async (req: Request, res: Response) => {
    try {
        const { userId, taskDescription } = req.body;

        if (!checkId({id: userId, res})) return;

        // Check if the user ID and task are provided
        if (!userId || !taskDescription) {
            return throwError({ message: "User ID and task description are required.", res, status: 400 });
        }

        // Construct the AI prompt to generate a question
        const aiPrompt = `
            Generate a clear and concise question that can test if this task is completed: "${taskDescription}".
            
            Requirements:
            - The question should be directly related to the task
            - Make it simple and understandable
            - Return ONLY the question text, nothing else
            - Do not include explanations, examples, or additional text
            - Do not use quotes around the question
            
            Task: ${taskDescription}
            Question:
        `;

        // Call OpenAI API to generate the question
        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 50, // Increased slightly for longer questions
        });

        // Extract the generated question from the AI response
        let generatedQuestion = response?.choices[0]?.message?.content?.trim();

        if (!generatedQuestion) {
            return throwError({ message: "Failed to generate a question.", res, status: 500 });
        }

        // Clean up the response - remove any extra text after the question
        // Split by common separators and take only the first part (the actual question)
        const cleanupPatterns = [
            /\?\s+This/i,  // "? This question is..."
            /\?\s+It/i,    // "? It checks..."
            /\?\s+The/i,   // "? The question..."
            /\?\s*\n/,     // "?\n" (newline after question)
        ];

        for (const pattern of cleanupPatterns) {
            if (pattern.test(generatedQuestion)) {
                generatedQuestion = generatedQuestion.split(pattern)[0] + '?';
                break;
            }
        }

        // Remove any trailing quotes or extra characters
        generatedQuestion = generatedQuestion.replace(/^["']|["']$/g, '').trim();

        // Ensure the question ends with a question mark
        if (!generatedQuestion.endsWith('?')) {
            generatedQuestion += '?';
        }

        console.log("Generated question:", generatedQuestion); // Debug log

        // Send the generated question to the user
        res.status(200).json({
            message: "Task completion question generated successfully.",
            question: generatedQuestion,
        });
    } catch (error) {
        console.error("Error generating question:", error);
        return throwError({ message: "Internal server error", res, status: 500 });
    }
};

// API to check if the task is completed based on the AI-generated question and user answer
export const checkQuestionCompletion = async (req: Request, res: Response) => {
    try {
        const { userId, question, userAnswer } = req.body;

        if (!checkId({id: userId, res})) return;

        if (!userId || !question || !userAnswer) {
            return throwError({ message: "User ID, question, and user answer are required.", res, status: 400 });
        }

        const aiPrompt = `
            The user has been assigned the following question: "${question}".
            The user has provided the following answer: "${userAnswer}".
            Please analyze the answer and determine if it is true or not.
            Return only "true" if the answer is correct, otherwise return "false".
            The answer may be vague, so please make a decision based on context and clarity.
        `;

        const response = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 10,
        });

        // Extract the result (true/false) from the AI response
        const aiResponse = response?.choices[0]?.message?.content?.trim().toLowerCase();

        // Validate the response and send appropriate result
        if (aiResponse === "true" || aiResponse === "false") {
            res.status(200).json({
                message: "Completion status checked successfully.",
                questionAnswered: aiResponse === "true",
            });
        } else {
            return throwError({ message: "Failed to determine completion.", res, status: 500 });
        }
    } catch (error) {
        console.error("Error checking completion:", error);
        return throwError({ message: "Internal server error", res, status: 500 });
    }
};

// API to generate a daily adventure with challenges
export const generateDailyAdventure = async () => {
    try {
        // Check if openai is initialized
        if (!openai) {
            console.error("OpenAI client is not initialized");
            return;
        }

        // Get the current date
        const today = new Date();
        const startDate = today;
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);  // End date of the adventure (24 hours from now)

        const aiPrompt = `
            Generate a fun, educational, and interactive adventure story that consists of a series of challenges.
            Each challenge should be solvable, either by answering a learning question math, physics, riddle, and others.
            The challenges must be part of the story and lead to the conclusion of the adventure.
            The story should be about a quest, like finding a treasure, solving a mystery, or saving the world.

            Example Adventure: 
            "The Jungle Quest" - "You’ve entered a magical jungle where treasures are hidden. To find them, you must solve puzzles, complete challenges, and work together!"

            generate it in json format as:
            {
                "title": "string (10-50 chars)",
                "description": "string",
                "starsReward": "number (10-30)",
                "coinsReward": "number (20-50)",
                "challenges": [
                    {
                        "title": "string (10-40 chars)",
                        "content": "string",
                        "starsReward": "number (5-15)",
                        "coinsReward": "number (10-25)",
                    },
                    ...
                ]
            }

            Format Requirements:
            - Return strictly valid JSON with no additional text
            - Follow the schema exactly as specified
            - All string fields must be properly escaped
            - All numerical values must be positive integers
            - Do not include any text outside the JSON.
            - Do not leave any keys or values missing.
            - Use proper syntax and close all brackets and quotes.
            - Output only the JSON without any extra text.
            
            Story Requirements:
            - Create 7 challenges that progress in difficulty
            - Generate a solvable, not hard challenges 

        `;
        
        let response;
        try {
            response = await openai.chat.completions.create({
                model: "deepseek-chat",
                messages: [{ role: "system", content: aiPrompt }],
                temperature: 0.8,
                max_tokens: 1000,
            });
        } catch (apiError) {
            console.error("OpenAI API Error:", apiError);
            return;
        }
        
        // Extract the generated adventure from the AI response
        const adventureText = response?.choices?.[0]?.message?.content;

        if (!adventureText) {
            console.error("Failed to generate adventure content - no text returned");
            console.error("Response structure:", JSON.stringify(response, null, 2));
            return;
        }

        console.log("Adventure text generated successfully");

        let adventure;
        try {
            // Clean the response by removing markdown code blocks
            let cleanedText = adventureText.trim();
            
            // Remove ```json and ``` if present
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
                        
            // Attempt to parse the cleaned response
            adventure = JSON.parse(cleanedText);
        } catch (error) {
            console.error("AI Response Parsing Error:", error);
            return;
        }
        const newAdventure = new Adventure({
            title: adventure.title,
            description: adventure.description,
            starsReward: 20,  
            coinsReward: 30, 
            iscompleted: false,
            startDate: startDate,
            endDate: endDate,
            challenges: adventure.challenges.map((challenge: any) => ({
                title: challenge.title,
                content: challenge.content,
                starsReward: challenge.starsReward,
                coinsReward: challenge.coinsReward,
            })),
        });

        // Save the adventure to the database
        await newAdventure.save();
        console.log("Daily adventure generated successfully:", adventure.title);

    } catch (error) {
        console.error("Error generating scheduled adventure:", error);
    }
};

// Route version for manual testing
export const generateDailyAdventureRoute = async (req: Request, res: Response) => {
    try {
        await generateDailyAdventure();
        res.status(200).json({ message: "Daily adventure generated successfully!" });
    } catch (error) {
        console.error("Error in generateDailyAdventureRoute:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

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
const startDailyGeneratesSchedule = async () => {
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

        generateDailyAdventure(); // Generate the daily adventure

        setInterval(() => {
            users.forEach(user => {
                generateDailyMessage(user._id.toString());
            });
            generateDailyAdventure(); 
        }, 24 * 60 * 60 * 1000); 
    }, timeUntilNextRun); 
};

startDailyGeneratesSchedule();