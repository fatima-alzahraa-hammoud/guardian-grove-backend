"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyAdventure = exports.checkQuestionCompletion = exports.generateTaskCompletionQuestion = exports.generateQuickTips = exports.generateViewTasks = exports.generateStory = exports.generateTrackDay = exports.generateLearningZone = exports.generateDailyMessage = exports.generateGrowthPlans = exports.regenerateGoalsAndTasksRoute = exports.regenerateGoalsAndTasks = void 0;
const getCompletedTasks_1 = require("../utils/AIHelperMethods/getCompletedTasks");
const getLastChatMessages_1 = require("../utils/AIHelperMethods/getLastChatMessages");
const generateGoalsAndTasks_1 = require("../utils/AIHelperMethods/generateGoalsAndTasks");
const user_model_1 = require("../models/user.model");
const index_1 = require("../index");
const checkId_1 = require("../utils/checkId");
const error_1 = require("../utils/error");
const date_fns_1 = require("date-fns");
const adventure_model_1 = require("../models/adventure.model");
const regenerateGoalsAndTasks = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Step 1: Get the last 3 chats and the last 6 messages of each chat
        const lastChats = yield (0, getLastChatMessages_1.getLastChatMessages)(userId);
        // Step 2: Get the tasks completed by the user
        const completedTasks = yield (0, getCompletedTasks_1.getCompletedTasks)(userId);
        // Step 3: Get the user's interests
        const user = yield user_model_1.User.findById(userId);
        const interests = (user === null || user === void 0 ? void 0 : user.interests) || [];
        // Step 4: Regenerate new goals based on the data
        const regeneratedGoals = yield (0, generateGoalsAndTasks_1.generateGoalsAndTasks)(userId, lastChats, completedTasks, interests);
        return regeneratedGoals;
    }
    catch (error) {
        console.error('Error generating and saving goals and tasks:', error);
    }
});
exports.regenerateGoalsAndTasks = regenerateGoalsAndTasks;
const regenerateGoalsAndTasksRoute = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({ message: "User ID is required." });
            return;
        }
        const generatedTasksAndGoals = yield (0, exports.regenerateGoalsAndTasks)(userId);
        res.status(200).json({ message: "Goals and tasks regenerated successfully.", goal: generatedTasksAndGoals });
    }
    catch (error) {
        console.error("Error in regenerateGoalsAndTasksRoute:", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.regenerateGoalsAndTasksRoute = regenerateGoalsAndTasksRoute;
const generateGrowthPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
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
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });
        const generatedPlan = response.choices[0].message.content;
        res.status(200).json({ message: "Generate growth plan successfully", plan: generatedPlan });
    }
    catch (error) {
        console.error('Error generating growth plan:', error);
        throw new Error('Failed to generate growth plan');
    }
});
exports.generateGrowthPlans = generateGrowthPlans;
const generateDailyMessage = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return "User not found";
        }
        const aiPrompt = `
            Generate a motivational daily message for the user${user}.
            generate it without word message, and without ay introduction, directly the message.
            Make it organized, beautiful and friendly and not more than two lines
        `;
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });
        const dailyMessage = (_a = response === null || response === void 0 ? void 0 : response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content;
        user.dailyMessage = dailyMessage || "You are shining 💫";
        yield user.save();
    }
    catch (error) {
        console.log("Something went error", error);
    }
});
exports.generateDailyMessage = generateDailyMessage;
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
const startDailyMessageSchedule = () => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.User.find();
    if (users.length === 0) {
        console.log("No users found.");
        return;
    }
    const timeUntilNextRun = getTimeUntilNextRun();
    setTimeout(() => {
        users.forEach(user => {
            (0, exports.generateDailyMessage)(user._id.toString());
        });
        setInterval(() => {
            users.forEach(user => {
                (0, exports.generateDailyMessage)(user._id.toString());
            });
        }, 24 * 60 * 60 * 1000);
    }, timeUntilNextRun);
});
startDailyMessageSchedule();
const generateLearningZone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
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
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });
        const generatedLearningZone = response.choices[0].message.content;
        res.status(200).json({ message: "Generate learning zone successfully", learningZone: generatedLearningZone });
    }
    catch (error) {
        console.error('Error generating learning zone:', error);
        throw new Error('Failed to generate learning zone');
    }
});
exports.generateLearningZone = generateLearningZone;
const generateTrackDay = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = req.body;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const today = new Date();
        // Collect data for the track of the day
        const unlockedAchievements = user.achievements.filter(achievement => (0, date_fns_1.isToday)(new Date(achievement.unlockedAt)) // Filter achievements unlocked today
        ).map(achievement => achievement.achievementId.toString());
        const purchasedItems = user.purchasedItems.filter(item => (0, date_fns_1.isToday)(new Date(item.purchasedAt)) // Filter items purchased today
        ).map(item => item.itemId.toString());
        const completedGoals = user.goals.filter(goal => goal.completedAt && (0, date_fns_1.isToday)(new Date(goal.completedAt)) && goal.isCompleted // Filter goals completed today
        );
        const completedTasks = completedGoals.flatMap(goal => goal.tasks.filter(task => task.completedAt && (0, date_fns_1.isToday)(new Date(task.completedAt)) && task.isCompleted // Filter tasks completed today
        ));
        const completedAdventures = user.adventures.filter(adventure => adventure.isAdventureCompleted && adventure.challenges.some(challenge => challenge.completedAt && (0, date_fns_1.isToday)(new Date(challenge.completedAt)) // Filter adventures completed today
        ));
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
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });
        const dailySummary = (_a = response === null || response === void 0 ? void 0 : response.choices[0].message) === null || _a === void 0 ? void 0 : _a.content;
        res.status(200).json({ message: "Generate tack day successfully", dailySummary: dailySummary });
    }
    catch (error) {
        console.error("Error generating track of the day:", error);
    }
});
exports.generateTrackDay = generateTrackDay;
const generateStory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.body;
        // Fetch the user data
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const age = new Date().getFullYear() - user.birthday.getFullYear();
        // Base AI prompt for the story
        let aiPrompt = `
        Tell an engaging, motivating, and creative story. Make the story interesting and suitable for the user's age, which is ${age} years old.
        Focus on making the narrative fun and inspiring while considering their maturity, preferences, and engagement level based on age.
        Write it in interactive, organized, structured way.
    `;
        // Call OpenAI to generate the story
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
        });
        const story = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        // Return the generated story to the client
        res.status(200).json({ message: "Generate story successfully", story: story });
    }
    catch (error) {
        console.error("Error generating story:", error);
        res.status(500).json({ message: 'Error generating story' });
    }
});
exports.generateStory = generateStory;
const generateViewTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
        }
        const completedTasks = user.goals.flatMap(goal => goal.tasks.filter(task => task.isCompleted).map(task => task.title));
        const incompleteTasks = user.goals.flatMap(goal => goal.tasks.filter(task => !task.isCompleted).map(task => task.title));
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
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 300
        });
        let generatedViewTasks = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        res.status(200).json({
            message: "View tasks generated successfully",
            viewTasks: generatedViewTasks,
        });
    }
    catch (error) {
        console.error("Error generating view tasks:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.generateViewTasks = generateViewTasks;
const generateQuickTips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId } = req.body;
        // Check if the user ID is valid
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        const user = yield user_model_1.User.findById(userId);
        if (!user) {
            return (0, error_1.throwError)({ message: "User not found", res, status: 404 });
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
        `;
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 1,
            max_tokens: 50,
        });
        let generatedQuickTip = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!generatedQuickTip) {
            return (0, error_1.throwError)({ message: "Failed to generate quick tip", res, status: 500 });
        }
        const tipMatch = generatedQuickTip.match(/Tip\s\{\s*title:\s*"([^"]+)",\s*message:\s*"([^"]+)"\s*\}/);
        if (!tipMatch) {
            return (0, error_1.throwError)({ message: "Failed to parse quick tip", res, status: 500 });
        }
        const title = tipMatch[1]; // Extract title
        const message = tipMatch[2]; // Extract message
        // Create a notification for the tip
        const newNotification = {
            title,
            message: message,
            category: "tip",
            type: "personal",
            timestamp: new Date(),
            isRead: false,
            isReadBy: [],
        };
        user.notifications.push(newNotification);
        yield user.save();
        res.status(200).json({
            message: "Quick tip generated and notification created successfully",
            quickTip: { title, message },
            notification: newNotification,
        });
    }
    catch (error) {
        console.error("Error generating tip:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.generateQuickTips = generateQuickTips;
// API to generate a question to test task completion
const generateTaskCompletionQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { userId, taskDescription } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        // Check if the user ID and task are provided
        if (!userId || !taskDescription) {
            return (0, error_1.throwError)({ message: "User ID and task description are required.", res, status: 400 });
        }
        // Construct the AI prompt to generate a question
        const aiPrompt = `
            You are a helpful assistant. The user has given the following task: "${taskDescription}".
            Generate a clear and concise question that can test if the task is completed.
            The question should be directly related to the task.
            Make sure the question is simple and understandable.

            Generated question:
        `;
        // Call OpenAI API to generate the question
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 40,
        });
        // Extract the generated question from the AI response
        const generatedQuestion = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!generatedQuestion) {
            return (0, error_1.throwError)({ message: "Failed to generate a question.", res, status: 500 });
        }
        // Send the generated question to the user
        res.status(200).json({
            message: "Task completion question generated successfully.",
            question: generatedQuestion,
        });
    }
    catch (error) {
        console.error("Error generating question:", error);
        return (0, error_1.throwError)({ message: "Internal server error", res, status: 500 });
    }
});
exports.generateTaskCompletionQuestion = generateTaskCompletionQuestion;
// API to check if the task is completed based on the AI-generated question and user answer
const checkQuestionCompletion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { userId, question, userAnswer } = req.body;
        if (!(0, checkId_1.checkId)({ id: userId, res }))
            return;
        if (!userId || !question || !userAnswer) {
            return (0, error_1.throwError)({ message: "User ID, question, and user answer are required.", res, status: 400 });
        }
        const aiPrompt = `
            The user has been assigned the following question: "${question}".
            The user has provided the following answer: "${userAnswer}".
            Please analyze the answer and determine if it is true or not.
            Return only "true" if the answer is correct, otherwise return "false".
            The answer may be vague, so please make a decision based on context and clarity.
        `;
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.7,
            max_tokens: 10,
        });
        // Extract the result (true/false) from the AI response
        const aiResponse = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
        // Validate the response and send appropriate result
        if (aiResponse === "true" || aiResponse === "false") {
            res.status(200).json({
                message: "Completion status checked successfully.",
                questionAnswered: aiResponse === "true",
            });
        }
        else {
            return (0, error_1.throwError)({ message: "Failed to determine completion.", res, status: 500 });
        }
    }
    catch (error) {
        console.error("Error checking completion:", error);
        return (0, error_1.throwError)({ message: "Internal server error", res, status: 500 });
    }
});
exports.checkQuestionCompletion = checkQuestionCompletion;
// API to generate a daily adventure with challenges
const generateDailyAdventure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Get the current date
        const today = new Date();
        const startDate = today;
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1); // End date of the adventure (24 hours from now)
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
        const response = yield index_1.openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: aiPrompt }],
            temperature: 0.8,
            max_tokens: 1000,
        });
        // Extract the generated adventure from the AI response
        const adventureText = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
        if (!adventureText) {
            return (0, error_1.throwError)({ message: "Failed to generate adventure.", res, status: 500 });
        }
        let adventure;
        try {
            // Attempt to parse the response directly
            adventure = JSON.parse(adventureText);
        }
        catch (error) {
            console.error("AI Response Parsing Error:", error);
        }
        const newAdventure = new adventure_model_1.Adventure({
            title: adventure.title,
            description: adventure.description,
            starsReward: 20,
            coinsReward: 30,
            iscompleted: false,
            startDate: startDate,
            endDate: endDate,
            challenges: adventure.challenges.map((challenge) => ({
                title: challenge.title,
                content: challenge.content,
                starsReward: challenge.starsReward,
                coinsReward: challenge.coinsReward,
            })),
        });
        // Save the adventure to the database
        yield newAdventure.save();
        res.status(200).json({
            message: "Adventure generated successfully.",
            adventure: newAdventure,
        });
    }
    catch (error) {
        console.error("Error generating adventure:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.generateDailyAdventure = generateDailyAdventure;
