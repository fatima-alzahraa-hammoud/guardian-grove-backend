import { openai } from "../../index";
import { IGoal } from "../../interfaces/IGoal";
import { Family } from "../../models/family.model";
import { User } from "../../models/user.model";

export const generateGoalsAndTasks = async (userId: string, lastChats: any[], completedTasks: any[], interests: string[]) => {
    const user = await User.findById(userId).populate('goals');
    if (!user) {
        throw new Error("User not found");
    }

    const prompt = `
        Generate a goal for the user with multiple tasks based on the following information:
        - Last 3 chats: ${JSON.stringify(lastChats)}
        - Completed tasks: ${JSON.stringify(completedTasks)}
        - User interests: ${JSON.stringify(interests)}
        - User birthday: ${JSON.stringify(user.birthday)}

        IMPORTANT: Return ONLY a valid JSON object in this exact format. Do not include any other text, explanations, markdown formatting, or code blocks:

        {
            "title": "Goal Title",
            "description": "Goal description",
            "type": "personal",
            "rewards": {"stars": 20, "coins": 7},
            "tasks": [
                {
                    "title": "Task Title",
                    "description": "Task description",
                    "rewards": {"stars": 10, "coins": 5},
                    "isCompleted": false
                }
            ]
        }
        
        or 
        {
            "title": "Goal Title",
            "description": "Goal description",
            "type": "family",
            "rewards": {"stars": 20, "coins": 7},
            "tasks": [
                {
                    "title": "Task Title",
                    "description": "Task description",
                    "rewards": {"stars": 10, "coins": 5},
                    "isCompleted": false
                }
            ]
        }

        Requirements:
        - Type must be either "personal" or "family"
        - Include 3-5 tasks per goal
        - Make tasks age-appropriate and avoid repeating completed tasks
        - Stars should be 5-25, coins should be 2-10
        - Do not include any explanatory text before or after the JSON
    `;

    const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "system", content: prompt }],
        temperature: 0.7, // Reduced for more consistent formatting
    });

    const generatedContent = response.choices[0].message.content;
    console.log("Generated Content:", generatedContent);

    if (typeof generatedContent !== 'string') {
        throw new Error("Invalid response content. Expected a string.");
    }

    let generatedGoal;
    try {
        // Strategy 1: Try to parse as JSON directly
        let cleanedContent = generatedContent.trim();
        
        // Remove markdown code blocks if present
        if (cleanedContent.startsWith('```json')) {
            cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
            cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Remove any text before the JSON object
        const jsonStart = cleanedContent.indexOf('{');
        const jsonEnd = cleanedContent.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
            cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
        }

        // Remove markdown bold formatting
        cleanedContent = cleanedContent.replace(/\*\*/g, '');

        generatedGoal = JSON.parse(cleanedContent);

    } catch (jsonError) {
        console.log("JSON parsing failed, trying regex extraction...");
        
        // Strategy 2: Extract JSON using regex
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                let extractedJson = jsonMatch[0];
                // Clean up markdown formatting
                extractedJson = extractedJson.replace(/\*\*/g, '');
                generatedGoal = JSON.parse(extractedJson);
            } catch (regexError) {
                console.error("Regex extraction also failed:", regexError);
                throw new Error("Failed to parse AI response as JSON. Raw response: " + generatedContent);
            }
        } else {
            throw new Error("No JSON object found in AI response. Raw response: " + generatedContent);
        }
    }

    // Validate the parsed goal structure
    if (!generatedGoal.title || !generatedGoal.description || !generatedGoal.type || !generatedGoal.tasks) {
        throw new Error("Invalid goal structure. Missing required fields.");
    }

    const goal = {
        title: generatedGoal.title,
        description: generatedGoal.description,
        type: generatedGoal.type,
        tasks: generatedGoal.tasks.map((task: any) => ({
            title: task.title,
            description: task.description,
            rewards: task.rewards || { stars: 5, coins: 2 }, // Default rewards if missing
            type: generatedGoal.type,
            isCompleted: false,
        })),
        nbOfTasksCompleted: 0,
        isCompleted: false,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        rewards: generatedGoal.rewards || { stars: 20, coins: 5 }, // Default rewards if missing
        progress: 0,
    } as IGoal;

    // Add the generated goal to the user's goals array or family goals
    if (generatedGoal.type === 'personal') {
        user.goals.push(goal);
    } else if (generatedGoal.type === 'family' && user.familyId) {
        const family = await Family.findById(user.familyId);
        if (family) {
            family.goals.push(goal);
            await family.save();
        }
    }

    await user.save();

    return goal;
};