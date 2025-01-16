import cron from "node-cron";
import { User } from "../models/user.model";
import { generateDailyMessage, regenerateGoalsAndTasks } from "../controllers/ai.controller";

// Run daily at midnight
cron.schedule("0 8 * * *", async () => {
    console.log("Running scheduled task to regenerate goals and tasks...");

    try {
        // Fetch all users
        const users = await User.find();

        for (const user of users) {
            // Check if user has goals
            const hasGoals = user.goals && user.goals.length > 0;

            // Check if all goals are completed
            const allGoalsCompleted = hasGoals && user.goals.every(goal => goal.isCompleted);

            // Regenerate goals if there are no goals or all goals are completed
            if (!hasGoals || allGoalsCompleted) {
                console.log(`Regenerating goals for user: ${user._id}`);
                await regenerateGoalsAndTasks(user._id.toString());
            } else {
                console.log(`Skipping regeneration for user: ${user._id}`);
            }
        }
    } catch (error) {
        console.error("Error in scheduled task:", error);
    }
});


cron.schedule("0 9 * * *", async () => {
    const users = await User.find();

    for (const user of users) {
        const message = await generateDailyMessage(user._id.toString());
    }
    console.log("Daily messages sent successfully.");
});