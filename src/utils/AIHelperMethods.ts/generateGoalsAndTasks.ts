import { openai } from "../../index";
import { IGoal } from "../../interfaces/IGoal";
import { Family } from "../../models/family.model";
import { User } from "../../models/user.model";

export const generateGoalsAndTasks = async (userId: string, lastChats: any[], completedTasks: any[], interests: string[]) => {
    const user = await User.findById(userId).populate('goals');
    if (!user) {
        throw new Error("User not found");
    }

    //specific AI prompt
    const prompt = `
        Given the following information, generate a goal for the user with multiple tasks:
        - Last 3 chats (provide context for interests, goals, and activities):
        ${JSON.stringify(lastChats)}
        - Completed tasks (provide insight into tasks that have already been finished by the user):
        ${JSON.stringify(completedTasks)}
        - User interests (provide a list of activities or hobbies the user enjoys):
        ${JSON.stringify(interests)}

        The goal should include:
        - Title: A concise name for the goal.
        - Description: A detailed explanation of why this goal matters for the user.
        - rewards: {stars, coins}
        - Type: Specify if the goal is personal or family.
        - If **family**, make sure that the goal and tasks involve all family members. The tasks should require collaboration and should be engaging for all ages within the family.
        - If **personal**, create tasks that are focused on the individual's growth and self-improvement.

        For **family** goals:
        - The tasks should be collaborative and designed for family involvement. Tasks should be achievable together, such as family games, outdoor activities, or learning challenges.
        - Each task should be engaging and require the participation of multiple family members.
        - Tasks can include rewards that will motivate everyone in the family to contribute.

        For **personal** goals:
        - Tasks should focus on the individual user’s growth, such as personal development, learning, fitness, or hobbies.
        - Each task should be clear, focused, and motivating for the individual user.

        Each task should have:
        - Title: Short and motivational.
        - Description: Detailed but concise.
        - Rewards: Stars (default: 2) and coins (default: 1).
        - Type: Specify if it's "personal" or "family".
        - Status: All tasks start as incomplete.

        Example response format:
        Goal:
        {
            title: "Family Fitness Challenge",
            description: "A fun and healthy challenge for the whole family to participate in.",
            type: "family",
            rewards: {stars: 20, coins: 7}
            tasks: [
                { title: "Morning Yoga Session", description: "Start the day with a family yoga session.", rewards: { stars: 10, coins: 5 }, isCompleted: false },
                { title: "Family Walk", description: "Go for a walk around the neighborhood together.", rewards: { stars: 8, coins: 4 }, isCompleted: false }
            ]
        }

        OR

        Goal:
        {
            title: "Personal Reading Goal",
            description: "Focus on reading one new book every month to improve knowledge and relaxation.",
            type: "personal",
            rewards: {stars: 16, coins: 4}
            tasks: [
                { title: "Read a Chapter a Day", description: "Start with one chapter of your book daily.", rewards: { stars: 5, coins: 2 }, isCompleted: false },
                { title: "Finish the Book", description: "Complete reading the book by the end of the month.", rewards: { stars: 20, coins: 10 }, isCompleted: false }
            ]
        }
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", 
        messages: [{ role: "system", content: prompt }],
    });

    const generatedContent = response.choices[0].message.content;

    if (typeof generatedContent !== 'string') {
        throw new Error("Invalid response content. Expected a string.");
    }
    
    const generatedGoal = JSON.parse(generatedContent);
    // Format the generated data according to the Goal schema

    const goal =({
        title: generatedGoal.title,
        description: generatedGoal.description,
        type: generatedGoal.type, 
        tasks: generatedGoal.tasks.map((task: any) => ({
        title: task.title,
        description: task.description,
        rewards: task.rewards,
        type: generatedGoal.type,
        isCompleted: false,
        })),
        nbOfTasksCompleted: 0,
        isCompleted: false,
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 1 week from now
        rewards: generatedGoal.rewards,
        progress: 0,
    } as IGoal);

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
    
    await user.save();  // Save user with the new goal if personal

    return goal;
};
